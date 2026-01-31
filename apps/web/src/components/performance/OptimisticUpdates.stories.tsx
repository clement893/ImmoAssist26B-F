import type { Meta, StoryObj } from '@storybook/react';
import OptimisticUpdates from './OptimisticUpdates';

const meta: Meta<typeof OptimisticUpdates> = {
  title: 'Performance/OptimisticUpdates',
  component: OptimisticUpdates,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Component demonstrating optimistic update patterns with automatic rollback on error.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof OptimisticUpdates>;

export const Default: Story = {
  args: {},
};
