import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkipLink from '../SkipLink';

describe('SkipLink', () => {
  it('renders skip link with default text', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent('Aller au contenu principal');
  });

  it('renders skip link with custom label', () => {
    render(<SkipLink label="Skip to navigation" />);
    expect(screen.getByText('Skip to navigation')).toBeInTheDocument();
  });

  it('has correct href', () => {
    render(<SkipLink href="#main" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#main');
  });

  it('has default href to #main-content', () => {
    render(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('applies custom className', () => {
    const { container } = render(<SkipLink className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has sr-only class for screen readers', () => {
    const { container } = render(<SkipLink />);
    const link = container.querySelector('a');
    expect(link).toHaveClass('sr-only');
  });
});
