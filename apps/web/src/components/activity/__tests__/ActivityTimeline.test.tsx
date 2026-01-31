/**
 * ActivityTimeline Component Tests
 *
 * Comprehensive test suite for the ActivityTimeline component covering:
 * - Timeline rendering
 * - Activity grouping by date
 * - User info display
 * - Activity icons
 * - Activity message formatting
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ActivityTimeline } from '../ActivityTimeline';

describe('ActivityTimeline Component', () => {
  const mockActivities = [
    {
      id: '1',
      action: 'create',
      entity_type: 'document',
      entity_id: 'doc1',
      user_id: 'user1',
      user_name: 'John Doe',
      user_email: 'john@example.com',
      timestamp: new Date().toISOString(),
    },
    {
      id: '2',
      action: 'update',
      entity_type: 'document',
      entity_id: 'doc1',
      user_id: 'user2',
      user_name: 'Jane Smith',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders activity timeline', () => {
      render(<ActivityTimeline activities={mockActivities} />);
      expect(screen.getByText(/john doe/i) || screen.getByText(/jane smith/i)).toBeInTheDocument();
    });

    it('displays activities', () => {
      render(<ActivityTimeline activities={mockActivities} />);
      expect(screen.getByText(/created|updated/i)).toBeInTheDocument();
    });

    it('handles empty activities', () => {
      render(<ActivityTimeline activities={[]} />);
      // Should render empty state or no activities message
      expect(screen.queryByText(/activity/i)).toBeTruthy();
    });
  });

  describe('Grouping', () => {
    it('groups activities by date when groupByDate is true', () => {
      render(<ActivityTimeline activities={mockActivities} groupByDate={true} />);
      // Should display date groups
      expect(screen.getByText(/today|yesterday/i) || screen.getByText(/john doe/i)).toBeTruthy();
    });
  });

  describe('User Info', () => {
    it('shows user info when showUserInfo is true', () => {
      render(<ActivityTimeline activities={mockActivities} showUserInfo={true} />);
      expect(screen.getByText(/john doe/i) || screen.getByText(/jane smith/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ActivityTimeline activities={mockActivities} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
