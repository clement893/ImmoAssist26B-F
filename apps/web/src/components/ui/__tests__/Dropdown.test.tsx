/**
 * Dropdown Component Tests
 *
 * Comprehensive test suite for the Dropdown component covering:
 * - Rendering with different props
 * - Opening/closing behavior
 * - Item selection
 * - Keyboard navigation
 * - Position variants
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import Dropdown from '../Dropdown';
import type { DropdownItem } from '../Dropdown';

const mockItems: DropdownItem[] = [
  { label: 'Option 1', onClick: vi.fn() },
  { label: 'Option 2', onClick: vi.fn() },
  { label: 'Option 3', onClick: vi.fn() },
];

describe('Dropdown Component', () => {
  describe('Rendering', () => {
    it('renders trigger element', () => {
      render(<Dropdown trigger={<button>Open Menu</button>} items={mockItems} />);
      expect(screen.getByText('Open Menu')).toBeInTheDocument();
    });

    it('does not render menu initially', () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });

    it('renders menu when opened', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);
      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });
  });

  describe('Opening and Closing', () => {
    it('opens menu on trigger click', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);
      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('closes menu when clicking outside', async () => {
      render(
        <div>
          <Dropdown trigger={<button>Open</button>} items={mockItems} />
          <div>Outside</div>
        </div>
      );

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      const outside = screen.getByText('Outside');
      fireEvent.mouseDown(outside);

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('closes menu on Escape key', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('toggles menu on trigger click', async () => {
      render(<Dropdown trigger={<button>Toggle</button>} items={mockItems} />);

      const trigger = screen.getByText('Toggle');

      // Open
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });

      // Close
      fireEvent.click(trigger);
      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Item Selection', () => {
    it('calls onClick when item is clicked', async () => {
      const handleClick = vi.fn();
      const items: DropdownItem[] = [{ label: 'Click Me', onClick: handleClick }];

      render(<Dropdown trigger={<button>Open</button>} items={items} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menuItem = screen.getByText('Click Me');
        fireEvent.click(menuItem);
      });

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('closes menu after item selection', async () => {
      const items: DropdownItem[] = [{ label: 'Select', onClick: vi.fn() }];

      render(<Dropdown trigger={<button>Open</button>} items={items} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menuItem = screen.getByText('Select');
        fireEvent.click(menuItem);
      });

      await waitFor(() => {
        expect(screen.queryByRole('menu')).not.toBeInTheDocument();
      });
    });

    it('does not call onClick for disabled items', async () => {
      const handleClick = vi.fn();
      const items: DropdownItem[] = [{ label: 'Disabled', onClick: handleClick, disabled: true }];

      render(<Dropdown trigger={<button>Open</button>} items={items} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menuItem = screen.getByText('Disabled');
        fireEvent.click(menuItem);
      });

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Dividers', () => {
    it('renders divider items', async () => {
      const items: DropdownItem[] = [
        { label: 'Option 1', onClick: vi.fn() },
        { divider: true },
        { label: 'Option 2', onClick: vi.fn() },
      ];

      render(<Dropdown trigger={<button>Open</button>} items={items} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const separator = screen.getByRole('separator');
        expect(separator).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('opens menu on Enter key', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      trigger.focus();
      fireEvent.keyDown(trigger, { key: 'Enter' });

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('opens menu on Space key', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      trigger.focus();
      fireEvent.keyDown(trigger, { key: ' ' });

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
      });
    });

    it('navigates with ArrowDown', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        fireEvent.keyDown(menu, { key: 'ArrowDown' });
        const firstItem = screen.getByText('Option 1');
        expect(firstItem).toHaveFocus();
      });
    });

    it('navigates with ArrowUp', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        fireEvent.keyDown(menu, { key: 'ArrowUp' });
        const lastItem = screen.getByText('Option 3');
        expect(lastItem).toHaveFocus();
      });
    });
  });

  describe('Position Variants', () => {
    const positions: Array<'left' | 'right' | 'top' | 'bottom'> = [
      'left',
      'right',
      'top',
      'bottom',
    ];

    positions.forEach((position) => {
      it(`applies ${position} position classes`, async () => {
        const { container } = render(
          <Dropdown trigger={<button>Open</button>} items={mockItems} position={position} />
        );

        const trigger = screen.getByText('Open');
        fireEvent.click(trigger);

        await waitFor(() => {
          const menu = container.querySelector('[role="menu"]');
          expect(menu).toBeInTheDocument();
        });
      });
    });
  });

  describe('Item Variants', () => {
    it('renders danger variant items', async () => {
      const items: DropdownItem[] = [{ label: 'Delete', onClick: vi.fn(), variant: 'danger' }];

      render(<Dropdown trigger={<button>Open</button>} items={items} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menuItem = screen.getByText('Delete');
        expect(menuItem).toHaveClass('text-error-600');
      });
    });

    it('renders items with icons', async () => {
      const items: DropdownItem[] = [
        {
          label: 'With Icon',
          onClick: vi.fn(),
          icon: <span data-testid="icon">📁</span>,
        },
      ];

      render(<Dropdown trigger={<button>Open</button>} items={items} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId('icon')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('sets aria-haspopup on trigger', () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    });

    it('sets aria-expanded when open', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);
      const trigger = screen.getByRole('button');

      expect(trigger).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(trigger);

      await waitFor(() => {
        expect(trigger).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('sets role="menu" on menu container', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toHaveAttribute('aria-orientation', 'vertical');
      });
    });

    it('sets role="menuitem" on menu items', async () => {
      render(<Dropdown trigger={<button>Open</button>} items={mockItems} />);

      const trigger = screen.getByText('Open');
      fireEvent.click(trigger);

      await waitFor(() => {
        const menuItems = screen.getAllByRole('menuitem');
        expect(menuItems).toHaveLength(3);
      });
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className to dropdown container', () => {
      const { container } = render(
        <Dropdown trigger={<button>Open</button>} items={mockItems} className="custom-dropdown" />
      );
      const dropdown = container.querySelector('.custom-dropdown');
      expect(dropdown).toBeInTheDocument();
    });
  });
});
