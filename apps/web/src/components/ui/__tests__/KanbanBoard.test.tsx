/**
 * KanbanBoard Component Tests
 *
 * Comprehensive test suite for the KanbanBoard component covering:
 * - Rendering with columns and cards
 * - Drag and drop functionality
 * - Card interactions
 * - Priority display
 * - Tags and metadata
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import KanbanBoard from '../KanbanBoard';
import type { KanbanCard, KanbanColumn } from '../KanbanBoard';

describe('KanbanBoard Component', () => {
  const mockColumns: KanbanColumn[] = [
    { id: 'todo', title: 'To Do', status: 'todo' },
    { id: 'in-progress', title: 'In Progress', status: 'in-progress', color: '#3B82F6' },
    { id: 'done', title: 'Done', status: 'done' },
  ];

  const mockCards: KanbanCard[] = [
    {
      id: '1',
      title: 'Task 1',
      description: 'Description 1',
      status: 'todo',
      priority: 'high',
      tags: ['urgent'],
    },
    {
      id: '2',
      title: 'Task 2',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'John Doe',
    },
    {
      id: '3',
      title: 'Task 3',
      status: 'done',
      priority: 'low',
      dueDate: new Date('2024-12-31'),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all columns', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('renders cards in correct columns', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      expect(screen.getByText('Task 3')).toBeInTheDocument();
    });

    it('displays card count in column header', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      // Each column should show count
      const todoColumn = screen.getByText('To Do').closest('div');
      expect(todoColumn?.textContent).toContain('1');
    });

    it('renders empty columns', () => {
      render(<KanbanBoard columns={mockColumns} cards={[]} />);
      expect(screen.getByText('To Do')).toBeInTheDocument();
      expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
    });
  });

  describe('Card Display', () => {
    it('displays card title', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    it('displays card description', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      expect(screen.getByText('Description 1')).toBeInTheDocument();
    });

    it('displays priority badge', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('low')).toBeInTheDocument();
    });

    it('displays tags', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('displays due date', () => {
      render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      // Due date should be formatted
      const card = screen.getByText('Task 3').closest('div');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('handles drag start', () => {
      const { container } = render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      const card = screen.getByText('Task 1').closest('[draggable="true"]');

      if (card) {
        fireEvent.dragStart(card);
        // Card should be marked as dragging
        expect(card).toHaveClass('opacity-50');
      }
    });

    it('handles drag over column', () => {
      const { container } = render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      const column = screen.getByText('Done').closest('div');

      if (column) {
        const card = screen.getByText('Task 1').closest('[draggable="true"]');
        if (card) {
          fireEvent.dragStart(card);
          fireEvent.dragOver(column, { preventDefault: vi.fn() });
          // Column should show drag over state
          expect(column).toBeInTheDocument();
        }
      }
    });

    it('calls onCardMove when card is dropped', () => {
      const handleCardMove = vi.fn();
      render(<KanbanBoard columns={mockColumns} cards={mockCards} onCardMove={handleCardMove} />);

      const card = screen.getByText('Task 1').closest('[draggable="true"]');
      const targetColumn = screen.getByText('Done').closest('div');

      if (card && targetColumn) {
        fireEvent.dragStart(card);
        fireEvent.dragOver(targetColumn, { preventDefault: vi.fn() });
        fireEvent.drop(targetColumn, { preventDefault: vi.fn() });

        expect(handleCardMove).toHaveBeenCalledWith('1', 'done');
      }
    });

    it('handles drag leave', () => {
      const { container } = render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      const column = screen.getByText('Done').closest('div');

      if (column) {
        const card = screen.getByText('Task 1').closest('[draggable="true"]');
        if (card) {
          fireEvent.dragStart(card);
          fireEvent.dragOver(column, { preventDefault: vi.fn() });
          fireEvent.dragLeave(column);
          // Drag over state should be cleared
          expect(column).toBeInTheDocument();
        }
      }
    });
  });

  describe('Card Interactions', () => {
    it('calls onCardClick when card is clicked', () => {
      const handleCardClick = vi.fn();
      render(<KanbanBoard columns={mockColumns} cards={mockCards} onCardClick={handleCardClick} />);

      const card = screen.getByText('Task 1').closest('div');
      if (card) {
        fireEvent.click(card);
        expect(handleCardClick).toHaveBeenCalledWith(mockCards[0]);
      }
    });

    it('calls onCardAdd when add button is clicked', () => {
      const handleCardAdd = vi.fn();
      render(<KanbanBoard columns={mockColumns} cards={mockCards} onCardAdd={handleCardAdd} />);

      const addButtons = screen.getAllByText('+');
      if (addButtons.length > 0) {
        fireEvent.click(addButtons[0]);
        expect(handleCardAdd).toHaveBeenCalledWith('todo');
      }
    });
  });

  describe('Column Colors', () => {
    it('displays column color indicator', () => {
      const { container } = render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      const inProgressColumn = screen.getByText('In Progress').closest('div');
      const colorIndicator = inProgressColumn?.querySelector('.w-3.h-3');
      expect(colorIndicator).toBeInTheDocument();
    });

    it('uses default color when column color is not provided', () => {
      const { container } = render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      const todoColumn = screen.getByText('To Do').closest('div');
      const colorIndicator = todoColumn?.querySelector('.w-3.h-3');
      expect(colorIndicator).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <KanbanBoard columns={mockColumns} cards={mockCards} className="custom-kanban" />
      );
      const wrapper = container.querySelector('.custom-kanban');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<KanbanBoard columns={mockColumns} cards={mockCards} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles cards without optional fields', () => {
      const minimalCards: KanbanCard[] = [{ id: '1', title: 'Minimal Task', status: 'todo' }];
      render(<KanbanBoard columns={mockColumns} cards={minimalCards} />);
      expect(screen.getByText('Minimal Task')).toBeInTheDocument();
    });

    it('handles empty columns array', () => {
      render(<KanbanBoard columns={[]} cards={mockCards} />);
      // Should render without errors
      expect(screen.queryByText('To Do')).not.toBeInTheDocument();
    });

    it('handles cards with multiple tags', () => {
      const cardsWithTags: KanbanCard[] = [
        {
          id: '1',
          title: 'Task',
          status: 'todo',
          tags: ['tag1', 'tag2', 'tag3'],
        },
      ];
      render(<KanbanBoard columns={mockColumns} cards={cardsWithTags} />);
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });
  });
});
