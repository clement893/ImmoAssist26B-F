/**
 * FormBuilder Component Tests
 *
 * Comprehensive test suite for the FormBuilder component covering:
 * - Rendering different field types
 * - Form submission
 * - Validation
 * - Error handling
 * - Loading states
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import FormBuilder from '../FormBuilder';
import type { FormField } from '../FormBuilder';

describe('FormBuilder Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const textField: FormField = {
    name: 'name',
    label: 'Name',
    type: 'text',
    required: true,
  };

  const emailField: FormField = {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  };

  describe('Rendering', () => {
    it('renders text input field', () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('renders email input field', () => {
      render(<FormBuilder fields={[emailField]} onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders submit button', () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('button', { name: /soumettre/i })).toBeInTheDocument();
    });

    it('uses custom submit label', () => {
      render(
        <FormBuilder fields={[textField]} onSubmit={mockOnSubmit} submitLabel="Custom Submit" />
      );
      expect(screen.getByRole('button', { name: 'Custom Submit' })).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls onSubmit with form data', async () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Name');
      fireEvent.change(input, { target: { value: 'John' } });

      const submitButton = screen.getByRole('button', { name: /soumettre/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'John' });
      });
    });

    it('does not submit when validation fails', async () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /soumettre/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    it('shows error for required field', async () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Name');
      fireEvent.blur(input);

      const submitButton = screen.getByRole('button', { name: /soumettre/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/est requis/i)).toBeInTheDocument();
      });
    });

    it('validates email format', async () => {
      render(<FormBuilder fields={[emailField]} onSubmit={mockOnSubmit} />);

      const input = screen.getByLabelText('Email');
      fireEvent.change(input, { target: { value: 'invalid-email' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText(/email invalide/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading text when loading', () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} loading={true} />);
      expect(screen.getByText('Chargement...')).toBeInTheDocument();
    });

    it('disables submit button when loading', () => {
      render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} loading={true} />);
      const submitButton = screen.getByRole('button', { name: /chargement/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<FormBuilder fields={[textField]} onSubmit={mockOnSubmit} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
