import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
  });

  it('renders checked when checked prop is true', () => {
    render(<Checkbox checked />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onChange when clicked', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox onChange={handleChange} />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Checkbox disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('displays error message', () => {
    render(<Checkbox error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Checkbox className="custom-class" />);
    const checkbox = container.querySelector('input[type="checkbox"]');
    expect(checkbox).toHaveClass('custom-class');
  });
});
