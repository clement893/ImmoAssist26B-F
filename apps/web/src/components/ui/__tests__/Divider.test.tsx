import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Divider from '../Divider';

describe('Divider', () => {
  it('renders horizontal divider by default', () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector('hr');
    expect(hr).toBeInTheDocument();
    expect(hr).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('renders vertical divider', () => {
    const { container } = render(<Divider orientation="vertical" />);
    const hr = container.querySelector('hr');
    expect(hr).toBeInTheDocument();
    expect(hr).toHaveAttribute('aria-orientation', 'vertical');
    expect(hr).toHaveClass('border-l', 'h-full');
  });

  it('renders with label', () => {
    render(<Divider label="Or" />);
    expect(screen.getByText('Or')).toBeInTheDocument();
    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
  });

  it('applies variant classes', () => {
    const { rerender, container } = render(<Divider variant="solid" />);
    expect(container.querySelector('hr')).toHaveClass('border-solid');

    rerender(<Divider variant="dashed" />);
    expect(container.querySelector('hr')).toHaveClass('border-dashed');

    rerender(<Divider variant="dotted" />);
    expect(container.querySelector('hr')).toHaveClass('border-dotted');
  });

  it('applies spacing classes', () => {
    const { rerender, container } = render(<Divider spacing="none" />);
    let hr = container.querySelector('hr');
    expect(hr).not.toHaveClass('my-2', 'my-4', 'my-8');

    rerender(<Divider spacing="sm" />);
    hr = container.querySelector('hr');
    expect(hr).toHaveClass('my-2');

    rerender(<Divider spacing="md" />);
    hr = container.querySelector('hr');
    expect(hr).toHaveClass('my-4');

    rerender(<Divider spacing="lg" />);
    hr = container.querySelector('hr');
    expect(hr).toHaveClass('my-8');
  });

  it('applies vertical spacing classes correctly', () => {
    const { container } = render(<Divider orientation="vertical" spacing="sm" />);
    const hr = container.querySelector('hr');
    expect(hr).toHaveClass('mx-2');
    expect(hr).not.toHaveClass('my-2');
  });

  it('applies custom className', () => {
    const { container } = render(<Divider className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper role attribute', () => {
    const { container } = render(<Divider />);
    const hr = container.querySelector('hr');
    expect(hr).toHaveAttribute('role', 'separator');
  });

  it('renders label divider with proper structure', () => {
    const { container } = render(<Divider label="Test Label" />);
    const label = screen.getByText('Test Label');
    expect(label).toBeInTheDocument();
    expect(label.tagName).toBe('SPAN');

    const separators = screen.getAllByRole('separator');
    expect(separators).toHaveLength(2);
  });
});
