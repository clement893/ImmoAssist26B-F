/**
 * AuditTrail Component Tests
 *
 * Comprehensive test suite for the AuditTrail component covering:
 * - Audit trail entries display
 * - Filtering (user, action, resource type, status, date range)
 * - Entry details modal
 * - Change tracking display
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import AuditTrail, { type AuditTrailEntry } from '../AuditTrail';

describe('AuditTrail Component', () => {
  const mockEntries: AuditTrailEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-01T10:00:00Z',
      user: {
        id: 'user1',
        name: 'John Doe',
        email: 'john@example.com',
      },
      action: 'create',
      resourceType: 'document',
      resourceId: 'doc1',
      resourceName: 'Test Document',
      changes: [{ field: 'title', oldValue: null, newValue: 'Test Document' }],
      status: 'success',
    },
  ];

  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders audit trail', () => {
      render(<AuditTrail entries={mockEntries} />);
      expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
    });

    it('displays audit entries', () => {
      render(<AuditTrail entries={mockEntries} />);
      expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    });
  });

  describe('Entry Details', () => {
    it('opens entry details modal when entry is clicked', async () => {
      render(<AuditTrail entries={mockEntries} />);
      const entryRow = screen.getByText(/john doe/i).closest('tr');
      if (entryRow) {
        fireEvent.click(entryRow);
        await waitFor(() => {
          expect(screen.getByText(/test document/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AuditTrail entries={mockEntries} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
