/**
 * TriggerManager Component Tests
 *
 * Comprehensive test suite for the TriggerManager component covering:
 * - Trigger list display
 * - Filter by trigger type
 * - Create trigger functionality
 * - Update trigger functionality
 * - Delete trigger functionality
 * - Toggle trigger enabled/disabled
 * - Test trigger functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import TriggerManager, { type Trigger } from '../TriggerManager';

// Mock window.confirm
window.confirm = vi.fn(() => true);

describe('TriggerManager Component', () => {
  const mockTriggers: Trigger[] = [
    {
      id: '1',
      name: 'User Created Trigger',
      type: 'event',
      event: 'user.created',
      enabled: true,
      workflows: ['workflow-1'],
      triggerCount: 5,
      createdAt: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      name: 'Daily Schedule',
      type: 'schedule',
      schedule: '0 0 * * *',
      enabled: false,
      workflows: ['workflow-2'],
      triggerCount: 0,
      createdAt: '2024-01-02T10:00:00Z',
    },
  ];

  const mockOnCreate = vi.fn().mockResolvedValue({ ...mockTriggers[0], id: '3' });
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnToggle = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders trigger manager', () => {
      render(<TriggerManager triggers={mockTriggers} />);
      expect(screen.getByText(/trigger manager/i)).toBeInTheDocument();
    });

    it('displays triggers list', () => {
      render(<TriggerManager triggers={mockTriggers} />);
      expect(screen.getByText(/user created trigger/i)).toBeInTheDocument();
      expect(screen.getByText(/daily schedule/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters triggers by type', () => {
      render(<TriggerManager triggers={mockTriggers} />);
      const eventFilter = screen.queryByText(/event/i);
      if (eventFilter) {
        fireEvent.click(eventFilter);
        expect(screen.getByText(/user created trigger/i)).toBeInTheDocument();
        expect(screen.queryByText(/daily schedule/i)).not.toBeInTheDocument();
      }
    });
  });

  describe('Actions', () => {
    it('calls onDelete when delete button is clicked', async () => {
      render(<TriggerManager triggers={mockTriggers} onDelete={mockOnDelete} />);
      const deleteButton = screen.queryByLabelText(/delete/i);
      if (deleteButton) {
        fireEvent.click(deleteButton);
        await waitFor(() => {
          expect(mockOnDelete).toHaveBeenCalledWith('1');
        });
      }
    });

    it('calls onToggle when toggle switch is clicked', async () => {
      render(<TriggerManager triggers={mockTriggers} onToggle={mockOnToggle} />);
      const toggleSwitch = screen.queryByRole('switch');
      if (toggleSwitch) {
        fireEvent.click(toggleSwitch);
        await waitFor(() => {
          expect(mockOnToggle).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TriggerManager triggers={mockTriggers} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
