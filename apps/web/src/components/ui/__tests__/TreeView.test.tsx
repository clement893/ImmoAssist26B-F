/**
 * TreeView Component Tests
 *
 * Comprehensive test suite for the TreeView component covering:
 * - Rendering with nested nodes
 * - Node selection
 * - Expand/collapse functionality
 * - Checkboxes
 * - Multi-select
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import TreeView from '../TreeView';
import type { TreeNode } from '../TreeView';

describe('TreeView Component', () => {
  const mockNodes: TreeNode[] = [
    {
      id: '1',
      label: 'Parent 1',
      children: [
        { id: '1-1', label: 'Child 1-1' },
        { id: '1-2', label: 'Child 1-2' },
      ],
    },
    {
      id: '2',
      label: 'Parent 2',
      children: [
        {
          id: '2-1',
          label: 'Child 2-1',
          children: [{ id: '2-1-1', label: 'Grandchild 2-1-1' }],
        },
      ],
    },
    { id: '3', label: 'Leaf Node' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all root nodes', () => {
      render(<TreeView nodes={mockNodes} />);
      expect(screen.getByText('Parent 1')).toBeInTheDocument();
      expect(screen.getByText('Parent 2')).toBeInTheDocument();
      expect(screen.getByText('Leaf Node')).toBeInTheDocument();
    });

    it('renders children when parent is expanded', async () => {
      render(<TreeView nodes={mockNodes} />);

      const parent1 = screen.getByText('Parent 1');
      const expandButton = parent1.closest('div')?.querySelector('button');

      if (expandButton) {
        fireEvent.click(expandButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Child 1-1')).toBeInTheDocument();
        expect(screen.getByText('Child 1-2')).toBeInTheDocument();
      });
    });

    it('hides children when parent is collapsed', () => {
      render(<TreeView nodes={mockNodes} defaultExpanded={['1']} />);

      // Children should be visible initially
      expect(screen.getByText('Child 1-1')).toBeInTheDocument();

      const parent1 = screen.getByText('Parent 1');
      const expandButton = parent1.closest('div')?.querySelector('button');

      if (expandButton) {
        fireEvent.click(expandButton);
      }

      // Children should be hidden after collapse
      waitFor(() => {
        expect(screen.queryByText('Child 1-1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Node Selection', () => {
    it('calls onNodeSelect when node is clicked', () => {
      const handleNodeSelect = vi.fn();
      render(<TreeView nodes={mockNodes} onNodeSelect={handleNodeSelect} />);

      const leafNode = screen.getByText('Leaf Node');
      fireEvent.click(leafNode);

      expect(handleNodeSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: '3', label: 'Leaf Node' })
      );
    });

    it('selects single node in single-select mode', () => {
      render(<TreeView nodes={mockNodes} defaultSelected="3" />);
      const leafNode = screen.getByText('Leaf Node').closest('div');
      expect(leafNode).toHaveClass('bg-primary-50');
    });

    it('selects multiple nodes in multi-select mode', async () => {
      const handleNodeSelect = vi.fn();
      render(<TreeView nodes={mockNodes} onNodeSelect={handleNodeSelect} multiSelect />);

      fireEvent.click(screen.getByText('Parent 1'));
      fireEvent.click(screen.getByText('Parent 2'));

      expect(handleNodeSelect).toHaveBeenCalledTimes(2);
    });

    it('deselects node when clicked again in multi-select mode', () => {
      const handleNodeSelect = vi.fn();
      render(<TreeView nodes={mockNodes} onNodeSelect={handleNodeSelect} multiSelect />);

      const leafNode = screen.getByText('Leaf Node');
      fireEvent.click(leafNode);
      fireEvent.click(leafNode);

      expect(handleNodeSelect).toHaveBeenCalledTimes(2);
    });
  });

  describe('Expand/Collapse', () => {
    it('calls onNodeToggle when node is expanded', () => {
      const handleNodeToggle = vi.fn();
      render(<TreeView nodes={mockNodes} onNodeToggle={handleNodeToggle} />);

      const parent1 = screen.getByText('Parent 1');
      const expandButton = parent1.closest('div')?.querySelector('button');

      if (expandButton) {
        fireEvent.click(expandButton);
        expect(handleNodeToggle).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }), true);
      }
    });

    it('expands node when clicked', async () => {
      render(<TreeView nodes={mockNodes} />);

      const parent1 = screen.getByText('Parent 1');
      const expandButton = parent1.closest('div')?.querySelector('button');

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          expect(screen.getByText('Child 1-1')).toBeInTheDocument();
        });
      }
    });

    it('uses defaultExpanded prop', () => {
      render(<TreeView nodes={mockNodes} defaultExpanded={['1']} />);
      expect(screen.getByText('Child 1-1')).toBeInTheDocument();
    });
  });

  describe('Checkboxes', () => {
    it('renders checkboxes when showCheckboxes is true', () => {
      render(<TreeView nodes={mockNodes} showCheckboxes />);
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('does not render checkboxes when showCheckboxes is false', () => {
      render(<TreeView nodes={mockNodes} showCheckboxes={false} />);
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes.length).toBe(0);
    });

    it('updates checkbox state when node is selected', () => {
      render(<TreeView nodes={mockNodes} showCheckboxes defaultSelected="3" />);
      const checkbox = screen.getByRole('checkbox', { name: /Leaf Node/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe('Icons', () => {
    it('renders node icons when showIcons is true', () => {
      const nodesWithIcons: TreeNode[] = [
        { id: '1', label: 'Node', icon: <span data-testid="icon">📁</span> },
      ];
      render(<TreeView nodes={nodesWithIcons} showIcons />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('hides icons when showIcons is false', () => {
      const nodesWithIcons: TreeNode[] = [
        { id: '1', label: 'Node', icon: <span data-testid="icon">📁</span> },
      ];
      render(<TreeView nodes={nodesWithIcons} showIcons={false} />);
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled Nodes', () => {
    it('does not select disabled nodes', () => {
      const handleNodeSelect = vi.fn();
      const nodesWithDisabled: TreeNode[] = [{ id: '1', label: 'Disabled', disabled: true }];
      render(<TreeView nodes={nodesWithDisabled} onNodeSelect={handleNodeSelect} />);

      const disabledNode = screen.getByText('Disabled');
      fireEvent.click(disabledNode);

      expect(handleNodeSelect).not.toHaveBeenCalled();
    });

    it('applies disabled styling', () => {
      const nodesWithDisabled: TreeNode[] = [{ id: '1', label: 'Disabled', disabled: true }];
      render(<TreeView nodes={nodesWithDisabled} />);
      const disabledNode = screen.getByText('Disabled').closest('div');
      expect(disabledNode).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  describe('Nested Structure', () => {
    it('renders deeply nested nodes', async () => {
      render(<TreeView nodes={mockNodes} defaultExpanded={['2', '2-1']} />);
      expect(screen.getByText('Grandchild 2-1-1')).toBeInTheDocument();
    });

    it('handles multiple levels of nesting', () => {
      const deeplyNested: TreeNode[] = [
        {
          id: '1',
          label: 'Level 1',
          children: [
            {
              id: '1-1',
              label: 'Level 2',
              children: [
                {
                  id: '1-1-1',
                  label: 'Level 3',
                  children: [{ id: '1-1-1-1', label: 'Level 4' }],
                },
              ],
            },
          ],
        },
      ];
      render(<TreeView nodes={deeplyNested} defaultExpanded={['1', '1-1', '1-1-1']} />);
      expect(screen.getByText('Level 4')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('applies custom className', () => {
      const { container } = render(<TreeView nodes={mockNodes} className="custom-tree" />);
      const wrapper = container.querySelector('.custom-tree');
      expect(wrapper).toBeInTheDocument();
    });

    it('applies custom nodeClassName', () => {
      render(<TreeView nodes={mockNodes} nodeClassName="custom-node" />);
      const node = screen.getByText('Parent 1').closest('div');
      expect(node).toHaveClass('custom-node');
    });

    it('applies custom selectedClassName', () => {
      render(
        <TreeView nodes={mockNodes} defaultSelected="3" selectedClassName="custom-selected" />
      );
      const selectedNode = screen.getByText('Leaf Node').closest('div');
      expect(selectedNode).toHaveClass('custom-selected');
    });

    it('uses custom indentSize', () => {
      render(<TreeView nodes={mockNodes} indentSize={30} defaultExpanded={['1']} />);
      const child = screen.getByText('Child 1-1').closest('div');
      expect(child).toHaveStyle({ paddingLeft: expect.stringContaining('38') }); // 30 * 1 + 8
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TreeView nodes={mockNodes} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has role="tree"', () => {
      const { container } = render(<TreeView nodes={mockNodes} />);
      const tree = container.querySelector('[role="tree"]');
      expect(tree).toBeInTheDocument();
    });

    it('has aria-expanded on expand buttons', async () => {
      render(<TreeView nodes={mockNodes} defaultExpanded={['1']} />);
      const expandButton = screen.getByText('Parent 1').closest('div')?.querySelector('button');
      expect(expandButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty nodes array', () => {
      const { container } = render(<TreeView nodes={[]} />);
      const tree = container.querySelector('[role="tree"]');
      expect(tree).toBeInTheDocument();
    });

    it('handles nodes without children', () => {
      render(<TreeView nodes={[{ id: '1', label: 'Leaf' }]} />);
      expect(screen.getByText('Leaf')).toBeInTheDocument();
    });

    it('handles nodes with empty children array', () => {
      render(<TreeView nodes={[{ id: '1', label: 'Parent', children: [] }]} />);
      expect(screen.getByText('Parent')).toBeInTheDocument();
    });
  });
});
