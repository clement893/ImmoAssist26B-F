import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Slider from '../Slider';

describe('Slider', () => {
  it('renders slider input', () => {
    render(<Slider />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('type', 'range');
  });

  it('renders with label', () => {
    render(<Slider label="Volume" />);
    expect(screen.getByText('Volume')).toBeInTheDocument();
  });

  it('shows value when showValue is true', () => {
    render(<Slider value={50} showValue />);
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();

    render(<Slider onChange={handleChange} min={0} max={100} />);

    const slider = screen.getByRole('slider');
    // Use fireEvent for range inputs as user.type doesn't work well
    fireEvent.change(slider, { target: { value: '50' } });

    expect(handleChange).toHaveBeenCalled();
  });

  it('uses controlled value when provided', () => {
    const handleChange = vi.fn();
    const { rerender } = render(<Slider value={25} onChange={handleChange} />);
    let slider = screen.getByRole('slider');
    // HTML input values are strings
    expect(slider).toHaveValue('25');

    rerender(<Slider value={75} onChange={handleChange} />);
    slider = screen.getByRole('slider');
    expect(slider).toHaveValue('75');
  });

  it('uses defaultValue for uncontrolled', () => {
    render(<Slider defaultValue={30} />);
    const slider = screen.getByRole('slider');
    // HTML input values are strings
    expect(slider).toHaveValue('30');
  });

  it('applies min and max attributes', () => {
    render(<Slider min={10} max={90} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('min', '10');
    expect(slider).toHaveAttribute('max', '90');
  });

  it('applies step attribute', () => {
    render(<Slider step={5} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('step', '5');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Slider disabled />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeDisabled();
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<Slider fullWidth />);
    expect(container.firstChild).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    const { container } = render(<Slider className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders marks when provided', () => {
    const marks = [
      { value: 0, label: 'Min' },
      { value: 50, label: 'Mid' },
      { value: 100, label: 'Max' },
    ];

    render(<Slider marks={marks} />);

    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Mid')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('has proper aria attributes', () => {
    render(<Slider label="Volume" min={0} max={100} value={50} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-label', 'Volume');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax', '100');
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });
});
