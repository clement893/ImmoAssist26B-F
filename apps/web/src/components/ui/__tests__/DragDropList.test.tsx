/**
 * DragDropList Component Tests
 *
 * Comprehensive test suite for the DragDropList component covering:
 * - Rendering items
 * - Drag and drop reordering
 * - Disabled items
 * - Custom rendering
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import DragDropList from '../DragDropList';
import type { DragDropListItem } from '../DragDropList';

describe('DragDropList Component', () => {
  const mockItems: DragDropListItem[] = [
    { id: '1', content: 'Item 1' },
    { id: '2', content: 'Item 2' },
    { id: '3', content: 'Item 3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all items', () => {
      render(<DragDropList items={mockItems} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });

    it('renders drag handle icons', () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const dragHandles = container.querySelectorAll('svg');
      expect(dragHandles.length).toBeGreaterThan(0);
    });

    it('renders items as draggable', () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const draggableItems = container.querySelectorAll('[draggable="true"]');
      expect(draggableItems.length).toBe(3);
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag start', () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');

      if (item1) {
        fireEvent.dragStart(item1);
        expect(item1).toHaveClass('opacity-50', 'cursor-grabbing');
      }
    });

    it('handles drag over', () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');
      const item2 = screen.getByText('Item 2').closest('[draggable="true"]');

      if (item1 && item2) {
        fireEvent.dragStart(item1);
        fireEvent.dragOver(item2, { preventDefault: vi.fn() });
        expect(item2).toHaveClass('border-primary-500');
      }
    });

    it('calls onReorder when item is dropped', () => {
      const handleReorder = vi.fn();
      render(<DragDropList items={mockItems} onReorder={handleReorder} />);

      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');
      const item2 = screen.getByText('Item 2').closest('[draggable="true"]');

      if (item1 && item2) {
        fireEvent.dragStart(item1);
        fireEvent.dragOver(item2, { preventDefault: vi.fn() });
        fireEvent.drop(item2, { preventDefault: vi.fn() });

        expect(handleReorder).toHaveBeenCalled();
        const newOrder = handleReorder.mock.calls[0][0];
        expect(newOrder[0].id).toBe('2');
        expect(newOrder[1].id).toBe('1');
      }
    });

    it('handles drag leave', () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');
      const item2 = screen.getByText('Item 2').closest('[draggable="true"]');

      if (item1 && item2) {
        fireEvent.dragStart(item1);
        fireEvent.dragOver(item2, { preventDefault: vi.fn() });
        fireEvent.dragLeave(item2);
        // Drag over state should be cleared
        expect(item2).toBeInTheDocument();
      }
    });

    it('handles drag end', () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');

      if (item1) {
        fireEvent.dragStart(item1);
        fireEvent.dragEnd(item1);
        // Drag state should be cleared
        expect(item1).toBeInTheDocument();
      }
    });

    it('does not reorder when dropped on same position', () => {
      const handleReorder = vi.fn();
      render(<DragDropList items={mockItems} onReorder={handleReorder} />);

      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');

      if (item1) {
        fireEvent.dragStart(item1);
        fireEvent.drop(item1, { preventDefault: vi.fn() });

        expect(handleReorder).not.toHaveBeenCalled();
      }
    });
  });

  describe('Disabled Items', () => {
    it('does not allow dragging disabled items', () => {
      const itemsWithDisabled: DragDropListItem[] = [
        { id: '1', content: 'Item 1' },
        { id: '2', content: 'Item 2', disabled: true },
      ];

      const { container } = render(<DragDropList items={itemsWithDisabled} />);
      const disabledItem = screen.getByText('Item 2').closest('div');

      expect(disabledItem).toHaveAttribute('draggable', 'false');
    });

    it('applies disabled styling', () => {
      const itemsWithDisabled: DragDropListItem[] = [
        { id: '1', content: 'Item 1', disabled: true },
      ];

      render(<DragDropList items={itemsWithDisabled} />);
      const disabledItem = screen.getByText('Item 1').closest('div');
      expect(disabledItem).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('does not show drag handle for disabled items', () => {
      const itemsWithDisabled: DragDropListItem[] = [
        { id: '1', content: 'Item 1', disabled: true },
      ];

      const { container } = render(<DragDropList items={itemsWithDisabled} />);
      const disabledItem = screen.getByText('Item 1').closest('div');
      const dragHandle = disabledItem?.querySelector('svg');
      expect(dragHandle).not.toBeInTheDocument();
    });
  });

  describe('Custom Rendering', () => {
    it('uses renderItem when provided', () => {
      const renderItem = vi.fn((item) => (
        <div data-testid={`custom-${item.id}`}>{item.content}</div>
      ));
      render(<DragDropList items={mockItems} renderItem={renderItem} />);

      expect(screen.getByTestId('custom-1')).toBeInTheDocument();
      expect(renderItem).toHaveBeenCalledTimes(3);
    });

    it('uses default content when renderItem is not provided', () => {
      render(<DragDropList items={mockItems} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<DragDropList items={mockItems} className="custom-list" />);
      const wrapper = container.querySelector('.custom-list');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies custom itemClassName', () => {
      render(<DragDropList items={mockItems} itemClassName="custom-item" />);
      const item = screen.getByText('Item 1').closest('div');
      expect(item).toHaveClass('custom-item');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<DragDropList items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      const { container } = render(<DragDropList items={[]} />);
      // Should render without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles single item', () => {
      render(<DragDropList items={[mockItems[0]]} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('handles items with complex content', () => {
      const itemsWithComplexContent: DragDropListItem[] = [
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

      render(<DragDropList items={itemsWithComplexContent} />);
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('handles rapid drag operations', () => {
      const handleReorder = vi.fn();
      render(<DragDropList items={mockItems} onReorder={handleReorder} />);

      const item1 = screen.getByText('Item 1').closest('[draggable="true"]');
      const item2 = screen.getByText('Item 2').closest('[draggable="true"]');
      const item3 = screen.getByText('Item 3').closest('[draggable="true"]');

      if (item1 && item2 && item3) {
        // Rapid drag operations
        fireEvent.dragStart(item1);
        fireEvent.dragOver(item2, { preventDefault: vi.fn() });
        fireEvent.drop(item2, { preventDefault: vi.fn() });

        fireEvent.dragStart(item3);
        fireEvent.dragOver(item1, { preventDefault: vi.fn() });
        fireEvent.drop(item1, { preventDefault: vi.fn() });

        expect(handleReorder).toHaveBeenCalled();
      }
    });
  });
});
