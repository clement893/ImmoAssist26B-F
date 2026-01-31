/**
 * BillingPeriodToggle Component Tests
 *
 * Comprehensive test suite for the BillingPeriodToggle component covering:
 * - Rendering toggle buttons
 * - Value changes
 * - Active state styling
 * - Discount badge
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import BillingPeriodToggle from '../BillingPeriodToggle';

describe('BillingPeriodToggle Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders monthly button', () => {
      render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      expect(screen.getByText('Mensuel')).toBeInTheDocument();
    });

    it('renders yearly button', () => {
      render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      expect(screen.getByText('Annuel')).toBeInTheDocument();
    });

    it('renders discount badge on yearly button', () => {
      render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      expect(screen.getByText('-20%')).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('calls onChange when monthly button is clicked', () => {
      render(<BillingPeriodToggle value="year" onChange={mockOnChange} />);
      const monthlyButton = screen.getByText('Mensuel');
      fireEvent.click(monthlyButton);
      expect(mockOnChange).toHaveBeenCalledWith('month');
    });

    it('calls onChange when yearly button is clicked', () => {
      render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      const yearlyButton = screen.getByText('Annuel');
      fireEvent.click(yearlyButton);
      expect(mockOnChange).toHaveBeenCalledWith('year');
    });
  });

  describe('Active State', () => {
    it('applies primary variant to monthly button when value is month', () => {
      const { container } = render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      const monthlyButton = screen.getByText('Mensuel').closest('button');
      expect(monthlyButton).toBeInTheDocument();
    });

    it('applies primary variant to yearly button when value is year', () => {
      const { container } = render(<BillingPeriodToggle value="year" onChange={mockOnChange} />);
      const yearlyButton = screen.getByText('Annuel').closest('button');
      expect(yearlyButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible buttons', () => {
      render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles rapid clicks', () => {
      render(<BillingPeriodToggle value="month" onChange={mockOnChange} />);
      const monthlyButton = screen.getByText('Mensuel');
      const yearlyButton = screen.getByText('Annuel');

      fireEvent.click(monthlyButton);
      fireEvent.click(yearlyButton);
      fireEvent.click(monthlyButton);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
    });
  });
});
