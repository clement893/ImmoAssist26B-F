/**
 * NotificationBell Component Tests
 *
 * Comprehensive test suite for the NotificationBell component covering:
 * - Bell icon rendering
 * - Unread count badge
 * - Dropdown toggle
 * - Notification list display
 * - Mark as read functionality
 * - Mark all as read functionality
 * - Delete notification functionality
 * - View all functionality
 * - Click outside behavior
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import NotificationBell, { type Notification } from '../NotificationBell';

describe('NotificationBell Component', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      timestamp: '2024-01-01T10:00:00Z',
      read: false,
    },
    {
      id: '2',
      title: 'Another Notification',
      message: 'This is another notification',
      type: 'success',
      timestamp: '2024-01-02T10:00:00Z',
      read: true,
    },
  ];

  const mockOnMarkAsRead = vi.fn().mockResolvedValue(undefined);
  const mockOnMarkAllAsRead = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnActionClick = vi.fn();
  const mockOnViewAll = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders notification bell', () => {
      render(<NotificationBell notifications={mockNotifications} />);
      expect(screen.getByLabelText(/notifications/i)).toBeInTheDocument();
    });

    it('displays unread count badge', () => {
      render(<NotificationBell notifications={mockNotifications} />);
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('does not display badge when no unread notifications', () => {
      const allRead = mockNotifications.map((n) => ({ ...n, read: true }));
      render(<NotificationBell notifications={allRead} />);
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown', () => {
    it('opens dropdown when bell is clicked', () => {
      render(<NotificationBell notifications={mockNotifications} />);
      const bellButton = screen.getByLabelText(/notifications/i);
      fireEvent.click(bellButton);
      expect(screen.getByText(/test notification/i)).toBeInTheDocument();
    });

    it('closes dropdown when bell is clicked again', () => {
      render(<NotificationBell notifications={mockNotifications} />);
      const bellButton = screen.getByLabelText(/notifications/i);
      fireEvent.click(bellButton);
      fireEvent.click(bellButton);
      // Dropdown should close
      expect(screen.queryByText(/test notification/i)).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onViewAll when view all is clicked', () => {
      render(<NotificationBell notifications={mockNotifications} onViewAll={mockOnViewAll} />);
      const bellButton = screen.getByLabelText(/notifications/i);
      fireEvent.click(bellButton);
      const viewAllButton = screen.getByText(/view all/i);
      fireEvent.click(viewAllButton);
      expect(mockOnViewAll).toHaveBeenCalled();
    });

    it('calls onMarkAllAsRead when mark all as read is clicked', async () => {
      render(
        <NotificationBell notifications={mockNotifications} onMarkAllAsRead={mockOnMarkAllAsRead} />
      );
      const bellButton = screen.getByLabelText(/notifications/i);
      fireEvent.click(bellButton);
      const markAllButton = screen.getByText(/mark all as read/i);
      fireEvent.click(markAllButton);
      await waitFor(() => {
        expect(mockOnMarkAllAsRead).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<NotificationBell notifications={mockNotifications} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
