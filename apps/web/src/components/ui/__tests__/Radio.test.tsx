import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Radio from '../Radio';

describe('Radio', () => {
  it('renders radio input', () => {
    render(<Radio />);
    const radio = screen.getByRole('radio');
    expect(radio).toBeInTheDocument();
    expect(radio).toHaveAttribute('type', 'radio');
  });

  it('renders with label', () => {
    render(<Radio label="Option 1" />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
  });

  it('generates unique id when not provided', () => {
    const { container } = render(<Radio label="Test" />);
    const input = container.querySelector('input');
    const label = container.querySelector('label');
    expect(input?.id).toBeTruthy();
    expect(label?.getAttribute('for')).toBe(input?.id);
  });

  it('uses provided id', () => {
    const { container } = render(<Radio id="custom-id" label="Test" />);
    const input = screen.getByRole('radio');
    expect(input).toHaveAttribute('id', 'custom-id');
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('calls onChange when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Radio onChange={handleChange} />);

    await user.click(screen.getByRole('radio'));

    expect(handleChange).toHaveBeenCalled();
  });

  it('is checked when checked prop is true', () => {
    render(<Radio checked />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Radio disabled />);
    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();
  });

  it('applies error styling when error prop is provided', () => {
    const { container } = render(<Radio error="This field is required" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-error-500');
    // Radio component doesn't render error message, only applies styling
  });

  it('applies error styling when error is present', () => {
    const { container } = render(<Radio error="Error" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('border-error-500');
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<Radio fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    const { container } = render(<Radio className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });
});
