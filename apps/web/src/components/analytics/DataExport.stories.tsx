/**
 * DataExport Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import DataExport from './DataExport';

const meta: Meta<typeof DataExport> = {
  title: 'Analytics/DataExport',
  component: DataExport,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof DataExport>;

export const Default: Story = {
  args: {
    fields: [
      { id: 'id', name: 'ID', selected: true },
      { id: 'name', name: 'Name', selected: true },
      { id: 'email', name: 'Email', selected: true },
      { id: 'created_at', name: 'Created At', selected: false },
    ],
    onExport: async (config) => {
      console.log('Export data:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const ManyFields: Story = {
  args: {
    fields: Array.from({ length: 15 }, (_, i) => ({
      id: `field-${i}`,
      name: `Field ${i + 1}`,
      selected: i < 5,
    })),
    onExport: async (config) => {
      console.log('Export data:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const EmptyFields: Story = {
  args: {
    fields: [],
    onExport: async (config) => {
      console.log('Export data:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
