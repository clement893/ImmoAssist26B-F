/**
 * AuditTrail Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import AuditTrail from './AuditTrail';
import type { AuditEntry } from './AuditTrail';

const meta: Meta<typeof AuditTrail> = {
  title: 'Activity/AuditTrail',
  component: AuditTrail,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof AuditTrail>;

const sampleEntries: AuditEntry[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    user: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    action: 'UPDATE',
    resource: 'User',
    resourceId: 'user-123',
    changes: {
      before: { name: 'John', email: 'john@old.com' },
      after: { name: 'John Doe', email: 'john@example.com' },
    },
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
    action: 'CREATE',
    resource: 'Project',
    resourceId: 'proj-456',
    changes: {
      after: { name: 'New Project', status: 'active' },
    },
    ipAddress: '192.168.1.2',
  },
];

export const Default: Story = {
  args: {
    entries: sampleEntries,
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};

export const Empty: Story = {
  args: {
    entries: [],
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};

export const ManyEntries: Story = {
  args: {
    entries: Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: {
        id: String((i % 3) + 1),
        name: ['John Doe', 'Jane Smith', 'Bob Wilson'][i % 3],
        email: ['john@example.com', 'jane@example.com', 'bob@example.com'][i % 3],
      },
      action: ['CREATE', 'UPDATE', 'DELETE'][i % 3] as any,
      resource: ['User', 'Project', 'Document'][i % 3],
      resourceId: `res-${i}`,
      changes: {
        before: i % 2 === 0 ? { name: 'Old' } : undefined,
        after: { name: 'New' },
      },
      ipAddress: `192.168.1.${(i % 255) + 1}`,
    })),
    onFilterChange: (filters) => console.log('Filter changed:', filters),
  },
};
