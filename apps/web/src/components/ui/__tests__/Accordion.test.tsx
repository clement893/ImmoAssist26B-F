import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Accordion from '../Accordion';

describe('Accordion', () => {
  const defaultItems = [
    { id: '1', title: 'Item 1', content: 'Content 1' },
    { id: '2', title: 'Item 2', content: 'Content 2' },
    { id: '3', title: 'Item 3', content: 'Content 3' },
  ];

  it('renders all items', () => {
    render(<Accordion items={defaultItems} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('shows content when item is clicked', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} />);

    const item1 = screen.getByText('Item 1');
    await user.click(item1);

    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('hides content when item is clicked again', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} />);

    const item1 = screen.getByText('Item 1');
    await user.click(item1);
    expect(screen.getByText('Content 1')).toBeInTheDocument();

    await user.click(item1);
    expect(screen.queryByText('Content 1')).not.toBeInTheDocument();
  });

  it('allows multiple items to be open when allowMultiple is true', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} allowMultiple />);

    await user.click(screen.getByText('Item 1'));
    await user.click(screen.getByText('Item 2'));

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('opens defaultOpen items on mount', () => {
    const itemsWithDefault = [
      { id: '1', title: 'Item 1', content: 'Content 1', defaultOpen: true },
      { id: '2', title: 'Item 2', content: 'Content 2' },
    ];
    render(<Accordion items={itemsWithDefault} />);

    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.queryByText('Content 2')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Accordion items={defaultItems} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper ARIA attributes', () => {
    render(<Accordion items={defaultItems} />);

    const button = screen.getByRole('button', { name: 'Item 1' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'accordion-content-1');
  });
});
