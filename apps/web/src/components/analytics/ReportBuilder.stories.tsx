/**
 * ReportBuilder Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ReportBuilder from './ReportBuilder';

const meta: Meta<typeof ReportBuilder> = {
  title: 'Analytics/ReportBuilder',
  component: ReportBuilder,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ReportBuilder>;

export const Default: Story = {
  args: {
    onSave: async (config) => {
      console.log('Save report:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onPreview: (config) => console.log('Preview report:', config),
  },
};

export const WithExistingFields: Story = {
  args: {
    availableFields: [
      { id: 'revenue', name: 'Revenue', type: 'metric', selected: false },
      { id: 'users', name: 'Active Users', type: 'metric', selected: false },
      { id: 'date', name: 'Date', type: 'date', selected: false },
      { id: 'country', name: 'Country', type: 'dimension', selected: false },
    ],
    onSave: async (config) => {
      console.log('Save report:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onPreview: (config) => console.log('Preview report:', config),
  },
};
