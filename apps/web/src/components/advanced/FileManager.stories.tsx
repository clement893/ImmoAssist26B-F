/**
 * FileManager Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import FileManager from './FileManager';
import type { FileItem } from './FileManager';

const meta: Meta<typeof FileManager> = {
  title: 'Advanced/FileManager',
  component: FileManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof FileManager>;

const sampleFiles: FileItem[] = [
  {
    id: '1',
    name: 'Documents',
    type: 'folder',
    modified: '2024-03-20T10:00:00Z',
    path: '/Documents',
  },
  {
    id: '2',
    name: 'report.pdf',
    type: 'file',
    size: 1024000,
    modified: '2024-03-20T14:30:00Z',
    mimeType: 'application/pdf',
    path: '/Documents/report.pdf',
  },
];

export const Default: Story = {
  args: {
    files: sampleFiles,
    currentPath: '/',
    onNavigate: (path) => console.log('Navigate:', path),
    onUpload: async (files) => {
      console.log('Upload:', files);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDownload: async (file) => {
      console.log('Download:', file);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async (file) => {
      console.log('Delete:', file);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRename: async (file, newName) => {
      console.log('Rename:', { file, newName });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    files: [],
    currentPath: '/',
    onNavigate: (path) => console.log('Navigate:', path),
  },
};
