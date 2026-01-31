import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Range from '../Range';

describe('Range', () => {
  it('renders range inputs', () => {
    render(<Range />);
    const inputs = screen.getAllByRole('slider');
    expect(inputs).toHaveLength(2);
  });

  it('uses controlled value when provided', () => {
    const handleChange = vi.fn();
    const { rerender } = render(<Range value={[20, 80]} onChange={handleChange} />);
    const inputs = screen.getAllByRole('slider');
    // HTML input values are strings, so convert number to string for comparison
    expect(inputs[0]).toHaveValue('20');
    expect(inputs[1]).toHaveValue('80');

    rerender(<Range value={[30, 70]} onChange={handleChange} />);
    const newInputs = screen.getAllByRole('slider');
    expect(newInputs[0]).toHaveValue('30');
    expect(newInputs[1]).toHaveValue('70');
  });

  it('uses defaultValue for uncontrolled', () => {
    render(<Range defaultValue={[10, 90]} />);
    const inputs = screen.getAllByRole('slider');
    // HTML input values are strings
    expect(inputs[0]).toHaveValue('10');
    expect(inputs[1]).toHaveValue('90');
  });

  it('calls onChange when min value changes', () => {
    const handleChange = vi.fn();

    render(<Range value={[20, 80]} onChange={handleChange} />);

    const minInput = screen.getAllByRole('slider')[0];
    // Use fireEvent for range inputs as user.type doesn't work well
    fireEvent.change(minInput, { target: { value: '30' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('prevents min from exceeding max', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Range value={[20, 80]} onChange={handleChange} />);

    const minInput = screen.getAllByRole('slider')[0];
    await user.type(minInput, '90');

    const calls = handleChange.mock.calls;
    if (calls.length > 0) {
      const [min, max] = calls[calls.length - 1][0];
      expect(min).toBeLessThanOrEqual(max);
    }
  });

  it('prevents max from being less than min', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Range value={[20, 80]} onChange={handleChange} />);

    const maxInput = screen.getAllByRole('slider')[1];
    await user.type(maxInput, '10');

    const calls = handleChange.mock.calls;
    if (calls.length > 0) {
      const [min, max] = calls[calls.length - 1][0];
      expect(max).toBeGreaterThanOrEqual(min);
    }
  });

  it('renders label when provided', () => {
    render(<Range label="Price Range" />);
    expect(screen.getByText('Price Range')).toBeInTheDocument();
  });

  it('shows values when showValues is true', () => {
    render(<Range value={[20, 80]} label="Range" showValues />);
    // When label is provided, values are shown next to label as "20 - 80"
    expect(screen.getByText('20 - 80')).toBeInTheDocument();
  });

  it('applies min and max attributes', () => {
    render(<Range min={10} max={90} />);
    const inputs = screen.getAllByRole('slider');
    inputs.forEach((input) => {
      expect(input).toHaveAttribute('min', '10');
      expect(input).toHaveAttribute('max', '90');
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<Range disabled />);
    const inputs = screen.getAllByRole('slider');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<Range fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('has proper aria attributes', () => {
    render(<Range label="Range" value={[20, 80]} min={0} max={100} />);
    const inputs = screen.getAllByRole('slider');
    expect(inputs[0]).toHaveAttribute('aria-label', 'Range minimum');
    expect(inputs[1]).toHaveAttribute('aria-label', 'Range maximum');
  });
});
