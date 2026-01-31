/**
 * AnalyticsDashboard Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import AnalyticsDashboard from './AnalyticsDashboard';

const meta: Meta<typeof AnalyticsDashboard> = {
  title: 'Analytics/AnalyticsDashboard',
  component: AnalyticsDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof AnalyticsDashboard>;

export const Default: Story = {
  args: {
    onDateRangeChange: (range) => console.log('Date range changed:', range),
    onExport: () => console.log('Export analytics'),
  },
};

export const WithCustomMetrics: Story = {
  args: {
    metrics: [
      {
        label: 'Total Revenue',
        value: 28900,
        change: 12.5,
        changeType: 'increase',
        format: 'currency',
      },
      {
        label: 'Active Users',
        value: 2380,
        change: 8.3,
        changeType: 'increase',
        format: 'number',
      },
      {
        label: 'Conversion Rate',
        value: 3.2,
        change: -0.5,
        changeType: 'decrease',
        format: 'percentage',
      },
    ],
    onDateRangeChange: (range) => console.log('Date range changed:', range),
    onExport: () => console.log('Export analytics'),
  },
};
