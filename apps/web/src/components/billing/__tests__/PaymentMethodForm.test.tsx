/**
 * PaymentMethodForm Component Tests
 *
 * Comprehensive test suite for the PaymentMethodForm component covering:
 * - Form rendering
 * - Input formatting (card number, expiry date, CVV)
 * - Form validation
 * - Submit/cancel handlers
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import PaymentMethodForm, { type PaymentMethodData } from '../PaymentMethodForm';

describe('PaymentMethodForm Component', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders form fields', () => {
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cardholder name/i)).toBeInTheDocument();
    });

    it('renders submit and cancel buttons', () => {
      render(<PaymentMethodForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('uses default values when provided', () => {
      const defaultValues: Partial<PaymentMethodData> = {
        cardNumber: '1234 5678 9012 3456',
        cardholderName: 'John Doe',
      };
      render(<PaymentMethodForm onSubmit={mockOnSubmit} defaultValues={defaultValues} />);
      expect(screen.getByDisplayValue('1234 5678 9012 3456')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    });
  });

  describe('Input Formatting', () => {
    it('formats card number with spaces', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '1234567890123456');
      expect(cardInput).toHaveValue('1234 5678 9012 3456');
    });

    it('formats expiry date as MM/YY', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const expiryInput = screen.getByLabelText(/expiry date/i);
      await user.type(expiryInput, '1225');
      expect(expiryInput).toHaveValue('12/25');
    });

    it('limits CVV to 4 digits', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const cvvInput = screen.getByLabelText(/cvv/i);
      await user.type(cvvInput, '12345');
      expect(cvvInput).toHaveValue('1234');
    });
  });

  describe('Validation', () => {
    it('shows error for invalid card number', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '123');
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/valid card number/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid expiry date', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const expiryInput = screen.getByLabelText(/expiry date/i);
      await user.type(expiryInput, '12');
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/valid expiry date/i)).toBeInTheDocument();
      });
    });

    it('shows error for invalid CVV', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const cvvInput = screen.getByLabelText(/cvv/i);
      await user.type(cvvInput, '12');
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/valid cvv/i)).toBeInTheDocument();
      });
    });

    it('shows error for missing cardholder name', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/cardholder name/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data when valid', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/card number/i), '1234567890123456');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/cardholder name/i), 'John Doe');

      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<PaymentMethodForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PaymentMethodForm onSubmit={mockOnSubmit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
