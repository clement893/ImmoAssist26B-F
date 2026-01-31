import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette, { useCommandPalette } from '../CommandPalette';
import type { Command } from '../CommandPalette';

describe('CommandPalette', () => {
  const mockCommands: Command[] = [
    {
      id: '1',
      label: 'Test Command',
      description: 'Test description',
      action: vi.fn(),
      category: 'Test',
    },
  ];

  it('renders when open', () => {
    render(<CommandPalette commands={mockCommands} isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText(/tapez une commande/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <CommandPalette commands={mockCommands} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('filters commands by search', () => {
    const commands: Command[] = [
      { id: '1', label: 'Create User', action: vi.fn() },
      { id: '2', label: 'Delete Item', action: vi.fn() },
    ];

    render(<CommandPalette commands={commands} isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(/tapez une commande/i);
    fireEvent.change(input, { target: { value: 'Create' } });

    expect(screen.getByText('Create User')).toBeInTheDocument();
    expect(screen.queryByText('Delete Item')).not.toBeInTheDocument();
  });

  it('calls action when command is clicked', () => {
    const mockAction = vi.fn();
    const mockOnClose = vi.fn();
    const commands: Command[] = [{ id: '1', label: 'Test', action: mockAction }];

    render(<CommandPalette commands={commands} isOpen={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Test'));
    expect(mockAction).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });
});
