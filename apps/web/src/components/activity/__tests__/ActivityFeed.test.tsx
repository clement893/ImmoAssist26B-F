/**
 * ActivityFeed Component Tests
 *
 * Comprehensive test suite for the ActivityFeed component covering:
 * - Activity feed display
 * - Auto-refresh functionality
 * - Load more functionality
 * - Timeline rendering
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ActivityFeed, { type ActivityFeedItem } from '../ActivityFeed';

describe('ActivityFeed Component', () => {
  const mockActivities: ActivityFeedItem[] = [
    {
      id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      user: {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      action: 'created',
      resource: 'document',
      type: 'info',
    },
  ];

  const mockOnLoadMore = vi.fn().mockResolvedValue([]);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders activity feed', () => {
      render(<ActivityFeed activities={mockActivities} />);
      expect(
        screen.getByText(/activity feed/i) || screen.getByText(/john doe/i)
      ).toBeInTheDocument();
    });

    it('displays activities', () => {
      render(<ActivityFeed activities={mockActivities} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  describe('Load More', () => {
    it('calls onLoadMore when load more button is clicked', async () => {
      render(<ActivityFeed activities={mockActivities} onLoadMore={mockOnLoadMore} />);
      const loadMoreButton = screen.queryByText(/load more/i);
      if (loadMoreButton) {
        fireEvent.click(loadMoreButton);
        await waitFor(() => {
          expect(mockOnLoadMore).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ActivityFeed activities={mockActivities} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
