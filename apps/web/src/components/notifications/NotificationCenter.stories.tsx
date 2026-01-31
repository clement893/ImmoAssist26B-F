/**
 * NotificationCenter Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import NotificationCenter from './NotificationCenter';
import type { Notification } from './NotificationCenter';

const meta: Meta<typeof NotificationCenter> = {
  title: 'Notifications/NotificationCenter',
  component: NotificationCenter,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof NotificationCenter>;

const sampleNotifications: Notification[] = [
  {
    id: '1',
    title: 'Payment Received',
    message: 'Your payment of $99.00 has been processed successfully.',
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false,
  },
  {
    id: '2',
    title: 'New Comment',
    message: 'John Doe commented on your project.',
    type: 'info',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
  {
    id: '3',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight at 2 AM.',
    type: 'warning',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
];

export const Default: Story = {
  args: {
    notifications: sampleNotifications,
    onMarkAsRead: async (id) => {
      console.log('Mark as read:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onMarkAllAsRead: async () => {
      console.log('Mark all as read');
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onDelete: async (id) => {
      console.log('Delete notification:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
    onMarkAsRead: async (id) => {
      console.log('Mark as read:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onMarkAllAsRead: async () => {
      console.log('Mark all as read');
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onDelete: async (id) => {
      console.log('Delete notification:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};

export const ManyNotifications: Story = {
  args: {
    notifications: Array.from({ length: 15 }, (_, i) => ({
      id: String(i + 1),
      title: ['Payment Received', 'New Comment', 'System Alert'][i % 3],
      message: `Notification message ${i + 1}`,
      type: ['success', 'info', 'warning'][i % 3] as any,
      timestamp: new Date(Date.now() - i * 600000).toISOString(),
      read: i % 3 === 0,
    })),
    onMarkAsRead: async (id) => {
      console.log('Mark as read:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onMarkAllAsRead: async () => {
      console.log('Mark all as read');
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
    onDelete: async (id) => {
      console.log('Delete notification:', id);
      await new Promise((resolve) => setTimeout(resolve, 500));
    },
  },
};
