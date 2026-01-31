import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Avatar from '../Avatar';

describe('Avatar', () => {
  it('renders with image src', () => {
    render(<Avatar src="/test-avatar.jpg" alt="Test Avatar" />);
    const img = screen.getByAltText('Test Avatar');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-avatar.jpg');
  });

  it('renders initials fallback from name prop', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders initials fallback from name with single word', () => {
    render(<Avatar name="John" />);
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(<Avatar fallback="Custom" />);
    // getInitials takes first letter of each word, so "Custom" becomes "C"
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('renders ReactNode fallback', () => {
    render(<Avatar fallback={<span data-testid="custom-fallback">Custom</span>} />);
    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
  });

  it('renders question mark when no name or fallback', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { rerender, container } = render(<Avatar name="Test" size="xs" />);
    const avatar = container.firstChild as HTMLElement;
    expect(avatar).toHaveClass('w-6', 'h-6');

    rerender(<Avatar name="Test" size="sm" />);
    expect(avatar).toHaveClass('w-8', 'h-8');

    rerender(<Avatar name="Test" size="md" />);
    expect(avatar).toHaveClass('w-10', 'h-10');

    rerender(<Avatar name="Test" size="lg" />);
    expect(avatar).toHaveClass('w-12', 'h-12');

    rerender(<Avatar name="Test" size="xl" />);
    expect(avatar).toHaveClass('w-16', 'h-16');
  });

  it('renders status indicator', () => {
    const { rerender } = render(<Avatar name="Test" status="online" />);
    const statusIndicator = screen.getByLabelText('Status: online');
    expect(statusIndicator).toBeInTheDocument();
    expect(statusIndicator).toHaveClass('bg-success-500');

    rerender(<Avatar name="Test" status="away" />);
    expect(screen.getByLabelText('Status: away')).toHaveClass('bg-warning-500');

    rerender(<Avatar name="Test" status="busy" />);
    expect(screen.getByLabelText('Status: busy')).toHaveClass('bg-error-500');

    rerender(<Avatar name="Test" status="offline" />);
    expect(screen.getByLabelText('Status: offline')).toHaveClass('bg-gray-400');
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Avatar name="Test" onClick={handleClick} />);
    // "Test" becomes "T" (first letter only for single word)
    await user.click(screen.getByText('T'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<Avatar name="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has cursor-pointer class when onClick is provided', () => {
    const { container } = render(<Avatar name="Test" onClick={() => {}} />);
    expect(container.firstChild).toHaveClass('cursor-pointer');
  });

  it('uses default alt text when alt is not provided', () => {
    render(<Avatar src="/test.jpg" name="John Doe" />);
    // Component defaults alt to 'Avatar', and uses alt || name, so it uses 'Avatar'
    const img = screen.getByAltText('Avatar');
    expect(img).toBeInTheDocument();
  });
});
