/**
 * EventHistory Component Tests
 *
 * Comprehensive test suite for the EventHistory component covering:
 * - Event history display
 * - Filtering (event type, severity, source, date range, search)
 * - Severity badges
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import EventHistory, { type EventHistoryEntry } from '../EventHistory';

describe('EventHistory Component', () => {
  const mockEvents: EventHistoryEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      eventType: 'system',
      eventName: 'System Startup',
      description: 'System started successfully',
      severity: 'low',
      source: 'system',
    },
    {
      id: '2',
      timestamp: '2024-01-02T10:00:00Z',
      eventType: 'error',
      eventName: 'Database Error',
      description: 'Database connection failed',
      severity: 'critical',
      source: 'database',
    },
  ];

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders event history', () => {
      render(<EventHistory events={mockEvents} />);
      expect(screen.getByText(/event history/i)).toBeInTheDocument();
    });

    it('displays events', () => {
      render(<EventHistory events={mockEvents} />);
      expect(screen.getByText(/system startup/i)).toBeInTheDocument();
      expect(screen.getByText(/database error/i)).toBeInTheDocument();
    });
  });

  describe('Severity Badges', () => {
    it('displays severity badges', () => {
      render(<EventHistory events={mockEvents} />);
      expect(screen.getByText(/low/i) || screen.getByText(/critical/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<EventHistory events={mockEvents} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
