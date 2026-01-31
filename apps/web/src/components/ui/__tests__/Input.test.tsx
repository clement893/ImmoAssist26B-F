/**
 * Input Component Tests
 *
 * Comprehensive test suite for the Input component covering:
 * - Rendering with different types
 * - Label and placeholder
 * - Error states
 * - Disabled state
 * - Required field indication
 * - Accessibility features
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Input from '../Input';

expect.extend(toHaveNoViolations);

describe('Input Component', () => {
  describe('Rendering', () => {
    it('renders input element', () => {
      render(<Input label="Email" />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Input label="Email" placeholder="Enter your email" />);
      const input = screen.getByPlaceholderText('Enter your email');
      expect(input).toBeInTheDocument();
    });

    it('associates label with input', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });
  });

  describe('Input Types', () => {
    it('renders text input by default', () => {
      render(<Input label="Name" />);
      const input = screen.getByLabelText('Name');
      // Type defaults to "text" in HTML when not specified
      // Check that type is either "text" or not set (which defaults to text)
      const type = input.getAttribute('type');
      expect(type === 'text' || type === null).toBe(true);
    });

    it('renders email input', () => {
      render(<Input label="Email" type="email" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('renders password input', () => {
      render(<Input label="Password" type="password" />);
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('renders number input', () => {
      render(<Input label="Age" type="number" />);
      const input = screen.getByLabelText('Age');
      expect(input).toHaveAttribute('type', 'number');
    });
  });

  describe('Value Handling', () => {
    it('handles controlled value', () => {
      const { rerender } = render(<Input label="Name" value="John" onChange={() => {}} />);
      const input = screen.getByLabelText('Name') as HTMLInputElement;
      expect(input.value).toBe('John');

      rerender(<Input label="Name" value="Jane" onChange={() => {}} />);
      expect(input.value).toBe('Jane');
    });

    it('handles onChange event', () => {
      const handleChange = vi.fn();
      render(<Input label="Name" onChange={handleChange} />);
      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'Test' } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error State', () => {
    it('displays error message', () => {
      render(<Input label="Email" error="Invalid email address" />);
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('applies error styling when error is present', () => {
      const { container } = render(<Input label="Email" error="Error" />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('border-error-500');
    });

    it('does not display error when error is not provided', () => {
      render(<Input label="Email" />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<Input label="Email" disabled />);
      const input = screen.getByLabelText('Email');
      expect(input).toBeDisabled();
    });

    it('applies disabled styling', () => {
      const { container } = render(<Input label="Email" disabled />);
      const input = container.querySelector('input');
      // Component uses disabled:bg-gray-100 and disabled:cursor-not-allowed
      expect(input).toHaveClass('disabled:cursor-not-allowed');
    });
  });

  describe('Required Field', () => {
    it('shows required indicator when required', () => {
      render(<Input label="Email" required />);
      const label = screen.getByText('Email');
      expect(label).toHaveTextContent('*');
    });

    it('sets required attribute on input', () => {
      render(<Input label="Email" required />);
      const input = screen.getByLabelText('Email');
      // Component uses aria-required, but also spreads props which includes required
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Input label="Email" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria-describedby for error messages', () => {
      render(<Input label="Email" error="Error message" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby');
    });

    it('supports aria-invalid when error is present', () => {
      render(<Input label="Email" error="Error" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(<Input label="Email" helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('prioritizes error over helper text', () => {
      render(<Input label="Email" helperText="Helper text" error="Error message" />);
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });
});
