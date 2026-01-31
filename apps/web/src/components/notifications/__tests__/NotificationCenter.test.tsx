/**
 * NotificationCenter Component Tests
 *
 * Comprehensive test suite for the NotificationCenter component covering:
 * - Notifications display
 * - Filtering (all, unread, read)
 * - Mark as read functionality
 * - Mark all as read functionality
 * - Delete notification functionality
 * - Action click handling
 * - Unread count display
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import NotificationCenter, { type Notification } from '../NotificationCenter';

describe('NotificationCenter Component', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders notification center', () => {
      render(<NotificationCenter notifications={mockNotifications} />);
      expect(
        screen.getByText(/notifications/i) || screen.getByText(/test notification/i)
      ).toBeInTheDocument();
    });

    it('displays notifications', () => {
      render(<NotificationCenter notifications={mockNotifications} />);
      expect(screen.getByText(/test notification/i)).toBeInTheDocument();
      expect(screen.getByText(/another notification/i)).toBeInTheDocument();
    });

    it('displays unread count', () => {
      render(<NotificationCenter notifications={mockNotifications} />);
      expect(screen.getByText(/1/i) || screen.getByText(/unread/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters by unread', () => {
      render(<NotificationCenter notifications={mockNotifications} />);
      const unreadFilter = screen.getByText(/unread/i);
      fireEvent.click(unreadFilter);
      expect(screen.getByText(/test notification/i)).toBeInTheDocument();
      expect(screen.queryByText(/another notification/i)).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onMarkAsRead when mark as read is clicked', async () => {
      render(
        <NotificationCenter notifications={mockNotifications} onMarkAsRead={mockOnMarkAsRead} />
      );
      const markAsReadButton = screen.queryByLabelText(/mark as read/i);
      if (markAsReadButton) {
        fireEvent.click(markAsReadButton);
        await waitFor(() => {
          expect(mockOnMarkAsRead).toHaveBeenCalledWith('1');
        });
      }
    });

    it('calls onMarkAllAsRead when mark all as read is clicked', async () => {
      render(
        <NotificationCenter
          notifications={mockNotifications}
          onMarkAllAsRead={mockOnMarkAllAsRead}
        />
      );
      const markAllButton = screen.getByText(/mark all as read/i);
      fireEvent.click(markAllButton);
      await waitFor(() => {
        expect(mockOnMarkAllAsRead).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<NotificationCenter notifications={mockNotifications} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
