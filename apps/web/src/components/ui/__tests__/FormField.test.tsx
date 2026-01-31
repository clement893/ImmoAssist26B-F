/**
 * FormField Component Tests
 *
 * Comprehensive test suite for the FormField component covering:
 * - Rendering with label, error, helper text
 * - Required field handling
 * - Icon support
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FormField } from '../FormField';
import Input from '../Input';

describe('FormField Component', () => {
  describe('Rendering', () => {
    it('renders label when provided', () => {
      render(
        <FormField label="Email">
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('renders without label', () => {
      const { container } = render(
        <FormField>
          <Input type="text" />
        </FormField>
      );
      expect(container.querySelector('input')).toBeInTheDocument();
    });

    it('renders error message', () => {
      render(
        <FormField label="Email" error="Email is required">
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('renders helper text', () => {
      render(
        <FormField label="Email" helperText="Enter your email address">
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('hides helper text when error is present', () => {
      render(
        <FormField label="Email" error="Error" helperText="Helper text">
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });
  });

  describe('Required Field', () => {
    it('shows required asterisk when required is true', () => {
      render(
        <FormField label="Email" required>
          <Input type="email" />
        </FormField>
      );
      const label = screen.getByText('Email');
      expect(label.textContent).toContain('*');
    });

    it('does not show asterisk when required is false', () => {
      render(
        <FormField label="Email" required={false}>
          <Input type="email" />
        </FormField>
      );
      const label = screen.getByText('Email');
      expect(label.textContent).not.toContain('*');
    });
  });

  describe('Icons', () => {
    it('renders left icon', () => {
      const leftIcon = <span data-testid="left-icon">📧</span>;
      render(
        <FormField label="Email" leftIcon={leftIcon}>
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('renders right icon', () => {
      const rightIcon = <span data-testid="right-icon">✓</span>;
      render(
        <FormField label="Email" rightIcon={rightIcon}>
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('renders both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">📧</span>;
      const rightIcon = <span data-testid="right-icon">✓</span>;
      render(
        <FormField label="Email" leftIcon={leftIcon} rightIcon={rightIcon}>
          <Input type="email" />
        </FormField>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <FormField label="Email" className="custom-field">
          <Input type="email" />
        </FormField>
      );
      const wrapper = container.querySelector('.custom-field');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies fullWidth class when fullWidth is true', () => {
      const { container } = render(
        <FormField label="Email" fullWidth>
          <Input type="email" />
        </FormField>
      );
      const wrapper = container.querySelector('.w-full');
      expect(wrapper).toBeInTheDocument();
    });

    it('generates field ID when not provided', () => {
      render(
        <FormField name="email" label="Email">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id');
    });

    it('uses provided id', () => {
      render(
        <FormField id="custom-id" label="Email">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    it('uses name for id when id is not provided', () => {
      render(
        <FormField name="email" label="Email">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <FormField label="Email" error="Error" helperText="Helper">
          <Input type="email" />
        </FormField>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associates label with input', () => {
      render(
        <FormField label="Email">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toBeInTheDocument();
    });

    it('sets aria-invalid when error is present', () => {
      render(
        <FormField label="Email" error="Error">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('sets aria-required when required is true', () => {
      render(
        <FormField label="Email" required>
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('sets aria-describedby for error', () => {
      render(
        <FormField label="Email" error="Error">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      const errorId = input.getAttribute('aria-describedby');
      expect(errorId).toBeTruthy();
      expect(errorId).toContain('error');
    });

    it('sets aria-describedby for helper text', () => {
      render(
        <FormField label="Email" helperText="Helper">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      const helperId = input.getAttribute('aria-describedby');
      expect(helperId).toBeTruthy();
      expect(helperId).toContain('helper');
    });
  });

  describe('Edge Cases', () => {
    it('handles children without name prop', () => {
      render(
        <FormField name="email" label="Email">
          <Input type="email" />
        </FormField>
      );
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('name', 'email');
    });

    it('handles multiple children', () => {
      render(
        <FormField label="Fields">
          <div>
            <Input type="text" />
            <Input type="text" />
          </div>
        </FormField>
      );
      const inputs = screen.getAllByRole('textbox');
      expect(inputs.length).toBe(2);
    });
  });
});
