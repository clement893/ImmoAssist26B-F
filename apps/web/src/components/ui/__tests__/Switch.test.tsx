import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Switch from '../Switch';

describe('Switch', () => {
  it('renders switch input', () => {
    render(<Switch />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('renders with label', () => {
    render(<Switch label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    expect(screen.getByLabelText('Enable notifications')).toBeInTheDocument();
  });

  it('generates unique id when not provided', () => {
    const { container } = render(<Switch label="Test" />);
    const input = container.querySelector('input');
    const label = container.querySelector('label');
    expect(input?.id).toBeTruthy();
    expect(label?.getAttribute('for')).toBe(input?.id);
  });

  it('uses provided id', () => {
    const { container } = render(<Switch id="custom-id" label="Test" />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('id', 'custom-id');
    const label = container.querySelector('label');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('calls onChange when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Switch onChange={handleChange} />);

    await user.click(screen.getByRole('checkbox'));

    expect(handleChange).toHaveBeenCalled();
  });

  it('is checked when checked prop is true', () => {
    render(<Switch checked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Switch disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('displays error message', () => {
    render(<Switch error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveAttribute('role', 'alert');
  });

  it('applies error styling when error is present', () => {
    const { container } = render(<Switch error="Error" />);
    const switchDiv = container.querySelector('div[class*="ring-error"]');
    expect(switchDiv).toBeInTheDocument();
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<Switch fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    const { container } = render(<Switch className="custom-class" />);
    const switchDiv = container.querySelector('div[class*="custom-class"]');
    expect(switchDiv).toBeInTheDocument();
  });
});
