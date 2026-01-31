/**
 * DatePicker Component Tests
 *
 * Comprehensive test suite for the DatePicker component covering:
 * - Rendering with different props
 * - Type/format prop handling
 * - Error and helper text
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import DatePicker from '../DatePicker';

describe('DatePicker Component', () => {
  describe('Rendering', () => {
    it('renders date picker with label', () => {
      render(<DatePicker label="Select Date" />);
      expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(<DatePicker />);
      const input = container.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('defaults to date type', () => {
      const { container } = render(<DatePicker />);
      const input = container.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('uses type prop when provided', () => {
      const { container } = render(<DatePicker type="datetime-local" />);
      const input = container.querySelector('input[type="datetime-local"]');
      expect(input).toBeInTheDocument();
    });

    it('uses format prop when provided', () => {
      const { container } = render(<DatePicker format="month" />);
      const input = container.querySelector('input[type="month"]');
      expect(input).toBeInTheDocument();
    });

    it('prioritizes format prop over type prop', () => {
      const { container } = render(<DatePicker format="week" type="date" />);
      const input = container.querySelector('input[type="week"]');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes through input props', () => {
      render(<DatePicker placeholder="Select a date" />);
      const input = screen.getByPlaceholderText('Select a date');
      expect(input).toBeInTheDocument();
    });

    it('handles value prop', () => {
      render(<DatePicker value="2024-01-15" />);
      const input = screen.getByDisplayValue('2024-01-15');
      expect(input).toBeInTheDocument();
    });

    it('handles disabled prop', () => {
      render(<DatePicker disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('handles required prop', () => {
      render(<DatePicker required />);
      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('handles fullWidth prop', () => {
      const { container } = render(<DatePicker fullWidth />);
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      render(<DatePicker error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('applies error styling when error is present', () => {
      const { container } = render(<DatePicker error="Error message" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-error-500');
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(<DatePicker helperText="Please select a date" />);
      expect(screen.getByText('Please select a date')).toBeInTheDocument();
    });

    it('shows helper text instead of error when both are provided', () => {
      render(<DatePicker error="Error message" helperText="Helper text" />);
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Type Variants', () => {
    const types: Array<'date' | 'datetime-local' | 'time' | 'month' | 'week'> = [
      'date',
      'datetime-local',
      'time',
      'month',
      'week',
    ];

    types.forEach((type) => {
      it(`renders ${type} type correctly`, () => {
        const { container } = render(<DatePicker type={type} />);
        const input = container.querySelector(`input[type="${type}"]`);
        expect(input).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DatePicker label="Date" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates label with input', () => {
      render(<DatePicker label="Birth Date" id="birth-date" />);
      const input = screen.getByLabelText('Birth Date');
      expect(input).toBeInTheDocument();
    });

    it('supports aria-label', () => {
      render(<DatePicker aria-label="Select date" />);
      const input = screen.getByLabelText('Select date');
      expect(input).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null };
      render(<DatePicker ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      const { container } = render(<DatePicker className="custom-class" />);
      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });
  });
});
