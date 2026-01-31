/**
 * ActivityFeed Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ActivityFeed from './ActivityFeed';
import type { ActivityItem } from './ActivityFeed';

const meta: Meta<typeof ActivityFeed> = {
  title: 'Activity/ActivityFeed',
  component: ActivityFeed,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ActivityFeed>;

const sampleActivities: ActivityItem[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: {
      id: '1',
      name: 'John Doe',
      avatar: undefined,
    },
    type: 'create',
    message: 'created a new project',
    target: { type: 'project', name: 'Website Redesign' },
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    user: {
      id: '2',
      name: 'Jane Smith',
      avatar: undefined,
    },
    type: 'update',
    message: 'updated user settings',
    target: { type: 'user', name: 'Bob Wilson' },
  },
];

export const Default: Story = {
  args: {
    activities: sampleActivities,
    onLoadMore: async () => {
      console.log('Load more activities');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    activities: [],
    onLoadMore: async () => {
      console.log('Load more activities');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const ManyActivities: Story = {
  args: {
    activities: Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      timestamp: new Date(Date.now() - i * 600000).toISOString(),
      user: {
        id: String((i % 3) + 1),
        name: ['John Doe', 'Jane Smith', 'Bob Wilson'][i % 3],
        avatar: undefined,
      },
      type: ['create', 'update', 'delete'][i % 3] as any,
      message:
        ['created', 'updated', 'deleted'][i % 3] + ' a ' + ['project', 'user', 'document'][i % 3],
      target: {
        type: ['project', 'user', 'document'][i % 3],
        name: `Item ${i + 1}`,
      },
    })),
    onLoadMore: async () => {
      console.log('Load more activities');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
