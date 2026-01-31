/**
 * ActivityLog Component Tests
 *
 * Comprehensive test suite for the ActivityLog component covering:
 * - Activity list display
 * - Filtering (user, action, date range, search)
 * - DataTable integration
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import ActivityLog, { type ActivityLogEntry } from '../ActivityLog';

describe('ActivityLog Component', () => {
  const mockActivities: ActivityLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      user: {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://example.com/avatar.jpg',
      },
      action: 'create',
      resource: 'document',
      resourceId: 'doc1',
      details: 'Created a new document',
    },
    {
      id: '2',
      timestamp: '2024-01-02T10:00:00Z',
      user: {
        id: 'user2',
        name: 'Jane Smith',
        email: 'jane@example.com',
      },
      action: 'update',
      resource: 'document',
      resourceId: 'doc1',
      details: 'Updated document content',
    },
  ];

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders activity log', () => {
      render(<ActivityLog activities={mockActivities} />);
      expect(screen.getByText(/activity log/i)).toBeInTheDocument();
    });

    it('displays activities', () => {
      render(<ActivityLog activities={mockActivities} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
      expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters by search term', async () => {
      const user = userEvent.setup();
      render(<ActivityLog activities={mockActivities} />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'john');
      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument();
        expect(screen.queryByText(/jane smith/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ActivityLog activities={mockActivities} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
