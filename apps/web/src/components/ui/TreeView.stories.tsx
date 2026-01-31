import type { Meta, StoryObj } from '@storybook/react';
import TreeView from './TreeView';
import type { TreeNode } from './TreeView';

const meta: Meta<typeof TreeView> = {
  title: 'UI/TreeView',
  component: TreeView,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof TreeView>;

const sampleNodes: TreeNode[] = [
  {
    id: '1',
    label: 'Documents',
    children: [
      { id: '1-1', label: 'File1.pdf' },
      { id: '1-2', label: 'File2.docx' },
    ],
  },
  {
    id: '2',
    label: 'Images',
    children: [
      { id: '2-1', label: 'Photo1.jpg' },
      { id: '2-2', label: 'Photo2.png' },
    ],
  },
  {
    id: '3',
    label: 'Videos',
    children: [
      {
        id: '3-1',
        label: 'Movies',
        children: [
          { id: '3-1-1', label: 'Movie1.mp4' },
          { id: '3-1-2', label: 'Movie2.mp4' },
        ],
      },
    ],
  },
];

export const Default: Story = {
  args: {
    nodes: sampleNodes,
  },
};

export const WithIcons: Story = {
  args: {
    nodes: [
      {
        id: '1',
        label: 'Folder',
        icon: '📁',
        children: [{ id: '1-1', label: 'File', icon: '📄' }],
      },
    ],
    showIcons: true,
  },
};

export const WithCheckboxes: Story = {
  args: {
    nodes: sampleNodes,
    showCheckboxes: true,
    multiSelect: true,
  },
};

export const DefaultExpanded: Story = {
  args: {
    nodes: sampleNodes,
    defaultExpanded: ['1', '2'],
  },
};

export const DefaultSelected: Story = {
  args: {
    nodes: sampleNodes,
    defaultSelected: '1-1',
  },
};
