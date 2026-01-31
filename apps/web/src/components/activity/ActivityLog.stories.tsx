/**
 * ActivityLog Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import ActivityLog from './ActivityLog';
import type { Activity } from './ActivityLog';

const meta: Meta<typeof ActivityLog> = {
  title: 'Activity/ActivityLog',
  component: ActivityLog,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ActivityLog>;

const sampleActivities: Activity[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    action: 'created',
    resource: 'Project',
    resourceId: 'proj-123',
    details: 'Created new project "Website Redesign"',
    ipAddress: '192.168.1.1',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    action: 'updated',
    resource: 'User',
    resourceId: 'user-456',
    details: 'Updated user profile',
    ipAddress: '192.168.1.2',
  },
];

export const Default: Story = {
  args: {
    activities: sampleActivities,
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};

export const Empty: Story = {
  args: {
    activities: [],
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};

export const ManyActivities: Story = {
  args: {
    activities: Array.from({ length: 20 }, (_, i) => ({
      id: String(i + 1),
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: {
        id: String((i % 3) + 1),
        name: ['John Doe', 'Jane Smith', 'Bob Wilson'][i % 3],
        email: ['john@example.com', 'jane@example.com', 'bob@example.com'][i % 3],
      },
      action: ['created', 'updated', 'deleted'][i % 3],
      resource: ['Project', 'User', 'Document'][i % 3],
      resourceId: `res-${i}`,
      details: `Activity ${i + 1}`,
      ipAddress: `192.168.1.${(i % 255) + 1}`,
    })),
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};
