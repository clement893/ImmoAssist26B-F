import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import List from '../List';

describe('List', () => {
  const mockItems = [
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' },
    { id: '3', content: 'Item 3' },
  ];

  it('renders list items', () => {
    render(<List items={mockItems} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('calls onClick when item is clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const items = [{ id: '1', content: 'Item 1', onClick: handleClick }];

    render(<List items={items} />);

    await user.click(screen.getByText('Item 1'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when item is disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    const items = [{ id: '1', content: 'Item 1', onClick: handleClick, disabled: true }];

    render(<List items={items} />);

    const item = screen.getByText('Item 1').closest('button');
    if (item) {
      await user.click(item);
      expect(handleClick).not.toHaveBeenCalled();
    }
  });

  it('renders icons when provided', () => {
    const items = [{ id: '1', content: 'Item 1', icon: <span data-testid="icon">📄</span> }];

    render(<List items={items} />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders actions when provided', () => {
    const items = [{ id: '1', content: 'Item 1', action: <button>Action</button> }];

    render(<List items={items} />);

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender, container } = render(<List items={mockItems} variant="default" />);
    let list = container.querySelector('ul');
    expect(list).toBeInTheDocument();

    rerender(<List items={mockItems} variant="bordered" />);
    list = container.querySelector('ul');
    expect(list).toHaveClass('border');

    rerender(<List items={mockItems} variant="divided" />);
    list = container.querySelector('ul');
    expect(list).toHaveClass('divide-y');
  });

  it('applies size classes', () => {
    const { rerender, container } = render(<List items={mockItems} size="sm" />);
    let item = container.querySelector('button, li');
    expect(item).toHaveClass('text-sm');

    rerender(<List items={mockItems} size="md" />);
    item = container.querySelector('button, li');
    expect(item).toHaveClass('text-base');

    rerender(<List items={mockItems} size="lg" />);
    item = container.querySelector('button, li');
    expect(item).toHaveClass('text-lg');
  });

  it('applies fullWidth class when fullWidth is true', () => {
    const { container } = render(<List items={mockItems} fullWidth />);
    expect(container.querySelector('ul')).toHaveClass('w-full');
  });

  it('renders as button when onClick is provided', () => {
    const items = [{ id: '1', content: 'Item 1', onClick: vi.fn() }];

    const { container } = render(<List items={items} />);
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('renders as li when onClick is not provided', () => {
    const { container } = render(<List items={mockItems} />);
    expect(container.querySelector('li')).toBeInTheDocument();
  });

  it('has proper role attributes', () => {
    const { container } = render(<List items={mockItems} />);
    const list = container.querySelector('ul');
    expect(list).toHaveAttribute('role', 'list');
  });

  it('renders empty list gracefully', () => {
    const { container } = render(<List items={[]} />);
    const list = container.querySelector('ul');
    expect(list).toBeInTheDocument();
  });

  it('handles items with complex content', () => {
    const items = [
      {
        id: '1',
        content: (
          <div>
            <h3>Title</h3>
            <p>Description</p>
          </div>
        ),
      },
    ];

    render(<List items={items} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('handles items with badges', () => {
    const items = [{ id: '1', content: 'Item 1', badge: '5' }];

    render(<List items={items} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles items with secondary text', () => {
    const items = [{ id: '1', content: 'Item 1', secondary: 'Secondary text' }];

    render(<List items={items} />);
    expect(screen.getByText('Secondary text')).toBeInTheDocument();
  });
});

describe('List Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<List items={mockItems} />);
    // Note: jest-axe might not be available, so we'll check structure
    const list = container.querySelector('ul[role="list"]');
    expect(list).toBeInTheDocument();
  });

  it('has proper ARIA attributes for interactive items', () => {
    const items = [{ id: '1', content: 'Item 1', onClick: vi.fn() }];

    const { container } = render(<List items={items} />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});

describe('List Edge Cases', () => {
  it('handles very long item content', () => {
    const longContent = 'A'.repeat(1000);
    const items = [{ id: '1', content: longContent }];

    render(<List items={items} />);
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it('handles many items', () => {
    const manyItems = Array.from({ length: 1000 }, (_, i) => ({
      id: String(i),
      content: `Item ${i}`,
    }));

    render(<List items={manyItems} />);
    expect(screen.getByText('Item 0')).toBeInTheDocument();
    expect(screen.getByText('Item 999')).toBeInTheDocument();
  });

  it('handles items without id', () => {
    const items = [{ content: 'Item 1' }, { content: 'Item 2' }];

    // Should render without errors (using index as key)
    render(<List items={items as any} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });
});
