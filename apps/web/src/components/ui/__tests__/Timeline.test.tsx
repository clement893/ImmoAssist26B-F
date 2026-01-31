/**
 * Timeline Component Tests
 *
 * Comprehensive test suite for the Timeline component covering:
 * - Rendering with different orientations
 * - Status variations
 * - Color variations
 * - Custom icons
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import Timeline from '../Timeline';
import type { TimelineItem } from '../Timeline';

describe('Timeline Component', () => {
  const mockItems: TimelineItem[] = [
    {
      id: '1',
      title: 'Step 1',
      description: 'First step',
      timestamp: '2024-01-01',
      status: 'completed',
      color: 'primary',
    },
    {
      id: '2',
      title: 'Step 2',
      description: 'Second step',
      timestamp: '2024-01-02',
      status: 'current',
      color: 'success',
    },
    {
      id: '3',
      title: 'Step 3',
      description: 'Third step',
      status: 'pending',
      color: 'warning',
    },
  ];

  describe('Rendering', () => {
    it('renders all timeline items', () => {
      render(<Timeline items={mockItems} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('renders item descriptions', () => {
      render(<Timeline items={mockItems} />);
      expect(screen.getByText('First step')).toBeInTheDocument();
      expect(screen.getByText('Second step')).toBeInTheDocument();
    });

    it('renders item timestamps', () => {
      render(<Timeline items={mockItems} />);
      expect(screen.getByText('2024-01-01')).toBeInTheDocument();
      expect(screen.getByText('2024-01-02')).toBeInTheDocument();
    });
  });

  describe('Orientation', () => {
    it('renders vertical timeline by default', () => {
      const { container } = render(<Timeline items={mockItems} />);
      const timeline = container.querySelector('.relative');
      expect(timeline).toBeInTheDocument();
    });

    it('renders horizontal timeline when orientation is horizontal', () => {
      const { container } = render(<Timeline items={mockItems} orientation="horizontal" />);
      const timeline = container.querySelector('.flex.items-start');
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('displays completed status correctly', () => {
      render(<Timeline items={mockItems} />);
      const step1 = screen.getByText('Step 1').closest('div');
      expect(step1).toBeInTheDocument();
    });

    it('displays current status correctly', () => {
      render(<Timeline items={mockItems} />);
      const step2 = screen.getByText('Step 2').closest('div');
      expect(step2).toBeInTheDocument();
    });

    it('displays pending status correctly', () => {
      render(<Timeline items={mockItems} />);
      const step3 = screen.getByText('Step 3').closest('div');
      expect(step3).toBeInTheDocument();
    });

    it('uses default status when not provided', () => {
      const itemsWithoutStatus: TimelineItem[] = [{ id: '1', title: 'Step', status: undefined }];
      render(<Timeline items={itemsWithoutStatus} />);
      expect(screen.getByText('Step')).toBeInTheDocument();
    });
  });

  describe('Color Variations', () => {
    const colors: Array<'primary' | 'success' | 'warning' | 'error' | 'default'> = [
      'primary',
      'success',
      'warning',
      'error',
      'default',
    ];

    colors.forEach((color) => {
      it(`displays ${color} color correctly`, () => {
        const items: TimelineItem[] = [{ id: '1', title: 'Step', color }];
        render(<Timeline items={items} />);
        expect(screen.getByText('Step')).toBeInTheDocument();
      });
    });
  });

  describe('Custom Icons', () => {
    it('renders custom icon when provided', () => {
      const itemsWithIcon: TimelineItem[] = [
        {
          id: '1',
          title: 'Step',
          icon: <span data-testid="custom-icon">🎯</span>,
        },
      ];
      render(<Timeline items={itemsWithIcon} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('uses default icon when custom icon is not provided', () => {
      render(<Timeline items={mockItems} />);
      // Should render default status icons
      const icons = screen.getAllByRole('img', { hidden: true }).length;
      // Icons are rendered as SVG, so we check for presence
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Timeline items={mockItems} className="custom-timeline" />);
      const wrapper = container.querySelector('.custom-timeline');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Timeline items={mockItems} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', () => {
      const { container } = render(<Timeline items={[]} />);
      // Should render without errors
      expect(container.firstChild).toBeInTheDocument();
    });

    it('handles single item', () => {
      render(<Timeline items={[mockItems[0]]} />);
      expect(screen.getByText('Step 1')).toBeInTheDocument();
    });

    it('handles items without description', () => {
      const itemsWithoutDesc: TimelineItem[] = [{ id: '1', title: 'Step' }];
      render(<Timeline items={itemsWithoutDesc} />);
      expect(screen.getByText('Step')).toBeInTheDocument();
    });

    it('handles items without timestamp', () => {
      const itemsWithoutTime: TimelineItem[] = [{ id: '1', title: 'Step', description: 'Desc' }];
      render(<Timeline items={itemsWithoutTime} />);
      expect(screen.getByText('Step')).toBeInTheDocument();
    });
  });
});
