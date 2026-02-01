/** * TreeView Component * Hierarchical tree navigation component */ 'use client';
import { type ReactNode, useState, useCallback } from 'react';
import { clsx } from 'clsx';
export interface TreeNode {
  id: string;
  label: string;
  icon?: ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
  data?: unknown;
}
export interface TreeViewProps {
  nodes: TreeNode[];
  onNodeSelect?: (node: TreeNode) => void;
  onNodeToggle?: (node: TreeNode, expanded: boolean) => void;
  defaultExpanded?: string[];
  defaultSelected?: string;
  showIcons?: boolean;
  showCheckboxes?: boolean;
  multiSelect?: boolean;
  className?: string;
  nodeClassName?: string;
  selectedClassName?: string;
  indentSize?: number;
}
export default function TreeView({
  nodes,
  onNodeSelect,
  onNodeToggle,
  defaultExpanded = [],
  defaultSelected,
  showIcons = true,
  showCheckboxes = false,
  multiSelect = false,
  className,
  nodeClassName,
  selectedClassName,
  indentSize = 20,
}: TreeViewProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(defaultExpanded));
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(
    defaultSelected ? new Set([defaultSelected]) : new Set()
  );
  const isExpanded = useCallback(
    (nodeId: string) => {
      return expandedNodes.has(nodeId);
    },
    [expandedNodes]
  );
  const isSelected = useCallback(
    (nodeId: string) => {
      return selectedNodes.has(nodeId);
    },
    [selectedNodes]
  );
  const toggleExpanded = useCallback(
    (node: TreeNode) => {
      const newExpanded = new Set(expandedNodes);
      const wasExpanded = newExpanded.has(node.id);
      if (wasExpanded) {
        newExpanded.delete(node.id);
      } else {
        newExpanded.add(node.id);
      }
      setExpandedNodes(newExpanded);
      onNodeToggle?.(node, !wasExpanded);
    },
    [expandedNodes, onNodeToggle]
  );
  const handleNodeClick = useCallback(
    (node: TreeNode) => {
      if (node.disabled) return;
      if (node.children && node.children.length > 0) {
        toggleExpanded(node);
      }
      const newSelected = multiSelect ? new Set(selectedNodes) : new Set<string>();
      if (isSelected(node.id)) {
        if (multiSelect) {
          newSelected.delete(node.id);
        }
      } else {
        newSelected.add(node.id);
      }
      setSelectedNodes(newSelected);
      onNodeSelect?.(node);
    },
    [selectedNodes, isSelected, multiSelect, toggleExpanded, onNodeSelect]
  );
  const renderNode = (node: TreeNode, level: number = 0): ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const expanded = isExpanded(node.id);
    const selected = isSelected(node.id);
    return (
      <div key={node.id} className="tree-node">
        {' '}
        <div
          className={clsx(
            'flex items-center py-1 px-2 rounded-md cursor-pointer transition-modern', // UI Revamp - Transition moderne
            'hover:bg-muted',
            selected &&
              (selectedClassName ||
                'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'),
            node.disabled && 'opacity-50 cursor-not-allowed',
            nodeClassName
          )}
          style={{ paddingLeft: `${level * indentSize + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {' '}
          {/* Expand/Collapse Icon */}{' '}
          {hasChildren && (
            <button
              className="mr-1 p-0.5 hover:bg-muted rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node);
              }}
              aria-expanded={expanded}
            >
              {' '}
              <svg
                className={clsx('w-4 h-4 transition-transform', expanded && 'rotate-90')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />{' '}
              </svg>{' '}
            </button>
          )}{' '}
          {!hasChildren && <div className="w-5" />} {/* Checkbox */}{' '}
          {showCheckboxes && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => handleNodeClick(node)}
              onClick={(e) => e.stopPropagation()}
              className="mr-2"
              disabled={node.disabled}
            />
          )}{' '}
          {/* Node Icon */}{' '}
          {showIcons && node.icon && <span className="mr-2 flex-shrink-0">{node.icon}</span>}{' '}
          {/* Node Label */}{' '}
          <span className="flex-1 text-sm text-foreground"> {node.label} </span>{' '}
        </div>{' '}
        {/* Children */}{' '}
        {hasChildren && expanded && (
          <div className="tree-children">
            {' '}
            {node.children!.map((child) => renderNode(child, level + 1))}{' '}
          </div>
        )}{' '}
      </div>
    );
  };
  return (
    <div
      className={clsx(
        'tree-view',
        'bg-background',
        'border border-border rounded-lg',
        'p-2',
        className
      )}
      role="tree"
    >
      {' '}
      {nodes.map((node) => renderNode(node))}{' '}
    </div>
  );
}
