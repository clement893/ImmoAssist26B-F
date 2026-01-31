import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Progress from '../Progress';

describe('Progress', () => {
  it('renders progress bar', () => {
    const { container } = render(<Progress value={50} />);
    const progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('sets correct aria attributes', () => {
    const { container } = render(<Progress value={50} max={100} />);
    const progressBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('calculates percentage correctly', () => {
    const { container } = render(<Progress value={25} max={100} />);
    const progressBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressBar).toHaveStyle({ width: '25%' });
  });

  it('clamps value to 0-100 range', () => {
    const { rerender, container } = render(<Progress value={-10} />);
    let progressBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressBar).toHaveStyle({ width: '0%' });

    rerender(<Progress value={150} />);
    progressBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('applies size classes', () => {
    const { rerender, container } = render(<Progress value={50} size="sm" />);
    const track = container.querySelector('div[class*="bg-gray-200"]');
    expect(track).toHaveClass('h-1');

    rerender(<Progress value={50} size="md" />);
    expect(track).toHaveClass('h-2');

    rerender(<Progress value={50} size="lg" />);
    expect(track).toHaveClass('h-4');
  });

  it('applies variant classes', () => {
    const { rerender, container } = render(<Progress value={50} variant="default" />);
    let progressBar = container.querySelector('[role="progressbar"]');
    expect(progressBar).toHaveClass('bg-primary-600');

    rerender(<Progress value={50} variant="success" />);
    expect(progressBar).toHaveClass('bg-success-600');

    rerender(<Progress value={50} variant="warning" />);
    expect(progressBar).toHaveClass('bg-warning-600');

    rerender(<Progress value={50} variant="error" />);
    expect(progressBar).toHaveClass('bg-error-600');

    rerender(<Progress value={50} variant="info" />);
    expect(progressBar).toHaveClass('bg-info-600');
  });

  it('shows label when showLabel is true', () => {
    render(<Progress value={50} showLabel />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows custom label when provided', () => {
    render(<Progress value={50} label="Upload Progress" />);
    expect(screen.getByText('Upload Progress')).toBeInTheDocument();
  });

  it('shows both label and percentage when both are provided', () => {
    render(<Progress value={75} label="Download" showLabel />);
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('uses custom max value', () => {
    const { container } = render(<Progress value={50} max={200} />);
    const progressBar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressBar).toHaveAttribute('aria-valuemax', '200');
    expect(progressBar).toHaveStyle({ width: '25%' }); // 50/200 * 100 = 25%
  });

  it('applies custom className', () => {
    const { container } = render(<Progress value={50} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('rounds percentage when showing label', () => {
    render(<Progress value={33.7} showLabel />);
    expect(screen.getByText('34%')).toBeInTheDocument();
  });
});
