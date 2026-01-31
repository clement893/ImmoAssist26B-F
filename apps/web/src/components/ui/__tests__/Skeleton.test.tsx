import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Skeleton from '../Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-gray-200', 'rounded', 'animate-pulse');
  });

  it('applies variant classes', () => {
    const { rerender, container } = render(<Skeleton variant="text" />);
    expect(container.firstChild).toHaveClass('rounded');

    rerender(<Skeleton variant="circular" />);
    expect(container.firstChild).toHaveClass('rounded-full');

    rerender(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toHaveClass('rounded');
  });

  it('applies animation classes', () => {
    const { rerender, container } = render(<Skeleton animation="pulse" />);
    expect(container.firstChild).toHaveClass('animate-pulse');

    rerender(<Skeleton animation="wave" />);
    expect(container.firstChild).toHaveClass('animate-pulse');

    rerender(<Skeleton animation="none" />);
    expect(container.firstChild).not.toHaveClass('animate-pulse');
  });

  it('applies custom width and height as numbers', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
  });

  it('applies custom width and height as strings', () => {
    const { container } = render(<Skeleton width="50%" height="2rem" />);
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveStyle({ width: '50%', height: '2rem' });
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('combines all props correctly', () => {
    const { container } = render(
      <Skeleton variant="circular" animation="wave" width={40} height={40} className="custom" />
    );
    const skeleton = container.firstChild as HTMLElement;
    expect(skeleton).toHaveClass('rounded-full', 'animate-pulse', 'custom');
    expect(skeleton).toHaveStyle({ width: '40px', height: '40px' });
  });
});
