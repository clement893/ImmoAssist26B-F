import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '../Loading';

describe('Loading', () => {
  it('renders loading spinner', () => {
    const { container } = render(<Loading />);
    const spinner = container.querySelector('div[class*="animate-spin"]');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with text', () => {
    render(<Loading text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('renders full screen when fullScreen is true', () => {
    const { container } = render(<Loading fullScreen />);
    const fullScreenDiv = container.firstChild as HTMLElement;
    expect(fullScreenDiv).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('renders inline when fullScreen is false', () => {
    const { container } = render(<Loading fullScreen={false} />);
    const inlineDiv = container.firstChild as HTMLElement;
    expect(inlineDiv).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
    expect(inlineDiv).not.toHaveClass('fixed');
  });

  it('applies size classes', () => {
    const { rerender, container } = render(<Loading size="sm" />);
    const spinner = container.querySelector('div[class*="animate-spin"]');
    expect(spinner).toHaveClass('w-4', 'h-4', 'border-2');

    rerender(<Loading size="md" />);
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-2');

    rerender(<Loading size="lg" />);
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4');
  });

  it('applies custom className to spinner', () => {
    const { container } = render(<Loading className="custom-spinner" />);
    const spinner = container.querySelector('div[class*="animate-spin"]');
    expect(spinner).toHaveClass('custom-spinner');
  });

  it('displays text below spinner in fullScreen mode', () => {
    render(<Loading fullScreen text="Please wait" />);
    const text = screen.getByText('Please wait');
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('mt-4');
  });

  it('displays text below spinner in inline mode', () => {
    render(<Loading fullScreen={false} text="Please wait" />);
    const text = screen.getByText('Please wait');
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('mt-2', 'text-sm');
  });
});
