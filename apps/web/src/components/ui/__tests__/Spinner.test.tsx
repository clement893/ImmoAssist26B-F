import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from '../Spinner';

describe('Spinner', () => {
  it('renders spinner', () => {
    const { container } = render(<Spinner />);
    const spinner = container.firstChild as HTMLElement;
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  it('renders loading text for screen readers', () => {
    render(<Spinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toHaveClass('sr-only');
  });

  it('applies size classes', () => {
    const { rerender, container } = render(<Spinner size="sm" />);
    expect(container.firstChild).toHaveClass('w-4', 'h-4', 'border-2');

    rerender(<Spinner size="md" />);
    expect(container.firstChild).toHaveClass('w-8', 'h-8', 'border-2');

    rerender(<Spinner size="lg" />);
    expect(container.firstChild).toHaveClass('w-12', 'h-12', 'border-4');
  });

  it('applies color classes', () => {
    const { rerender, container } = render(<Spinner color="primary" />);
    expect(container.firstChild).toHaveClass('border-primary-600');

    rerender(<Spinner color="secondary" />);
    expect(container.firstChild).toHaveClass('border-gray-600');

    rerender(<Spinner color="white" />);
    expect(container.firstChild).toHaveClass('border-white');
  });

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('animate-spin');
  });

  it('applies custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has rounded-full class', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('rounded-full');
  });
});
