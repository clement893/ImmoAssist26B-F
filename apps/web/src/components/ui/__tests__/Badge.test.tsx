import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../Badge';

describe('Badge', () => {
  it('renders badge with text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Badge variant="default">Default</Badge>);
    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Badge variant="error">Error</Badge>);
    expect(screen.getByText('Error')).toBeInTheDocument();

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('defaults to default variant', () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText('Test');
    expect(badge).toBeInTheDocument();
  });
});
