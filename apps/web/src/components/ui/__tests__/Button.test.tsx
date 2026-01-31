/**
 * Button Component Tests
 *
 * Comprehensive test suite for the Button component covering:
 * - Rendering with different variants and sizes
 * - Loading state behavior
 * - Disabled state
 * - Click handlers
 * - Accessibility features
 * - Full width option
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import Button from '../Button';

expect.extend(toHaveNoViolations);

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('renders with default variant (primary)', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary-600');
    });

    it('renders with secondary variant', () => {
      const { container } = render(<Button variant="secondary">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-secondary-600');
    });

    it('renders with outline variant', () => {
      const { container } = render(<Button variant="outline">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('border-2', 'border-primary-600');
    });

    it('renders with ghost variant', () => {
      const { container } = render(<Button variant="ghost">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('text-gray-700');
    });

    it('renders with danger variant', () => {
      const { container } = render(<Button variant="danger">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-error-600');
    });
  });

  describe('Sizes', () => {
    it('renders with small size', () => {
      const { container } = render(<Button size="sm">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('renders with medium size (default)', () => {
      const { container } = render(<Button size="md">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-6', 'py-3', 'text-base');
    });

    it('renders with large size', () => {
      const { container } = render(<Button size="lg">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-8', 'py-4', 'text-lg');
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading is true', () => {
      render(<Button loading>Loading</Button>);
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables button when loading', () => {
      render(<Button loading>Loading</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('displays children text alongside spinner', () => {
      render(<Button loading>Processing...</Button>);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables button when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handlers', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Loading
        </Button>
      );
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Full Width', () => {
    it('applies full width class when fullWidth is true', () => {
      const { container } = render(<Button fullWidth>Full Width</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('w-full');
    });

    it('does not apply full width class when fullWidth is false', () => {
      const { container } = render(<Button>Normal</Button>);
      const button = container.querySelector('button');
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom ClassName', () => {
    it('merges custom className with default classes', () => {
      const { container } = render(<Button className="custom-class">Test</Button>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('font-medium'); // Default class
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Button>Accessible Button</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports aria-label', () => {
      render(<Button aria-label="Submit form">Submit</Button>);
      const button = screen.getByRole('button', { name: 'Submit form' });
      expect(button).toBeInTheDocument();
    });

    it('supports disabled state', () => {
      render(
        <Button disabled aria-label="Disabled button">
          Disabled
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      // Button uses native disabled attribute, not aria-disabled
    });
  });

  describe('HTML Attributes', () => {
    it('passes through standard HTML button attributes', () => {
      render(
        <Button type="submit" form="test-form" name="submit-btn">
          Submit
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('form', 'test-form');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });

    it('supports data attributes', () => {
      render(<Button data-testid="custom-button">Test</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });
  });
});
