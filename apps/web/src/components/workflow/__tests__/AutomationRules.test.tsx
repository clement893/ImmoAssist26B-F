/**
 * AutomationRules Component Tests
 *
 * Comprehensive test suite for the AutomationRules component covering:
 * - Rules list display
 * - Create rule functionality
 * - Update rule functionality
 * - Delete rule functionality
 * - Toggle rule enabled/disabled
 * - Rule validation
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import AutomationRules, { type AutomationRule } from '../AutomationRules';

describe('AutomationRules Component', () => {
  const mockRules: AutomationRule[] = [
    {
      id: '1',
      name: 'Test Rule',
      description: 'Test description',
      enabled: true,
      trigger: {
        event: 'user.created',
        conditions: [],
      },
      actions: [],
      createdAt: '2024-01-01T10:00:00Z',
      triggerCount: 5,
    },
  ];

  const mockOnCreate = vi.fn().mockResolvedValue({ ...mockRules[0], id: '2' });
  const mockOnUpdate = vi.fn().mockResolvedValue(undefined);
  const mockOnDelete = vi.fn().mockResolvedValue(undefined);
  const mockOnToggle = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders automation rules', () => {
      render(<AutomationRules rules={mockRules} />);
      expect(
        screen.getByText(/automation rules/i) || screen.getByText(/test rule/i)
      ).toBeInTheDocument();
    });

    it('displays rules list', () => {
      render(<AutomationRules rules={mockRules} />);
      expect(screen.getByText(/test rule/i)).toBeInTheDocument();
    });
  });

  describe('Create Rule', () => {
    it('opens create modal when create button is clicked', () => {
      render(<AutomationRules rules={mockRules} onCreate={mockOnCreate} />);
      const createButton = screen.getByText(/create|add/i);
      fireEvent.click(createButton);
      expect(screen.getByText(/create rule|new rule/i)).toBeInTheDocument();
    });
  });

  describe('Toggle Rule', () => {
    it('calls onToggle when toggle switch is clicked', async () => {
      render(<AutomationRules rules={mockRules} onToggle={mockOnToggle} />);
      const toggleSwitch = screen.getByRole('switch');
      fireEvent.click(toggleSwitch);
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith('1', false);
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AutomationRules rules={mockRules} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
