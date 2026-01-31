import type { Meta, StoryObj } from '@storybook/react';
import PerformanceDashboard from './PerformanceDashboard';

const meta: Meta<typeof PerformanceDashboard> = {
  title: 'Performance/PerformanceDashboard',
  component: PerformanceDashboard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Comprehensive performance monitoring dashboard with real-time metrics.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PerformanceDashboard>;

export const Default: Story = {
  args: {},
};

export const FastRefresh: Story = {
  args: {
    refreshInterval: 2000,
  },
};

export const SlowRefresh: Story = {
  args: {
    refreshInterval: 10000,
  },
};
