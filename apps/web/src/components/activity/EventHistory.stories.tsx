/**
 * EventHistory Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import EventHistory from './EventHistory';
import type { Event } from './EventHistory';

const meta: Meta<typeof EventHistory> = {
  title: 'Activity/EventHistory',
  component: EventHistory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof EventHistory>;

const sampleEvents: Event[] = [
  {
    id: '1',
    type: 'user.created',
    timestamp: new Date().toISOString(),
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    metadata: {
      userId: 'user-123',
      email: 'newuser@example.com',
    },
    severity: 'info',
  },
  {
    id: '2',
    type: 'payment.failed',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    metadata: {
      amount: 99.0,
      currency: 'USD',
    },
    severity: 'warning',
  },
];

export const Default: Story = {
  args: {
    events: sampleEvents,
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};

export const Empty: Story = {
  args: {
    events: [],
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};

export const ManyEvents: Story = {
  args: {
    events: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      type: ['user.created', 'payment.failed', 'subscription.updated'][i % 3],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: {
        id: String((i % 3) + 1),
        name: ['John Doe', 'Jane Smith', 'Bob Wilson'][i % 3],
        email: ['john@example.com', 'jane@example.com', 'bob@example.com'][i % 3],
      },
      metadata: {
        key: `value-${i}`,
      },
      severity: ['info', 'warning', 'error'][i % 3] as any,
    })),
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};
