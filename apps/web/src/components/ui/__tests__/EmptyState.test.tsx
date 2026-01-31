import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="No items" description="There are no items to display" />);
    expect(screen.getByText('There are no items to display')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const icon = <span data-testid="test-icon">📭</span>;
    render(<EmptyState title="Empty" icon={icon} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="Empty"
        action={{
          label: 'Add Item',
          onClick: handleClick,
        }}
      />
    );
    expect(screen.getByText('Add Item')).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        title="Empty"
        action={{
          label: 'Add Item',
          onClick: handleClick,
        }}
      />
    );

    await user.click(screen.getByText('Add Item'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Empty" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('does not render description when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const description = container.querySelector('p');
    expect(description).not.toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    const { container } = render(<EmptyState title="Empty" />);
    const iconContainer = container.querySelector('div[class*="mb-4"]');
    expect(iconContainer).not.toBeInTheDocument();
  });

  it('does not render action when not provided', () => {
    render(<EmptyState title="Empty" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
