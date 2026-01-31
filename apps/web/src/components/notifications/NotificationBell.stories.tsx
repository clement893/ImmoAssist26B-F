/**
 * NotificationBell Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import NotificationBell from './NotificationBell';
import type { Notification } from './NotificationBell';

const meta: Meta<typeof NotificationBell> = {
  title: 'Notifications/NotificationBell',
  component: NotificationBell,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof NotificationBell>;

const sampleNotifications: Notification[] = [
  {
    id: '1',
    title: 'Payment Received',
    message: 'Your payment has been processed.',
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

export const NoNotifications: Story = {
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

export const ManyUnread: Story = {
  args: {
    notifications: Array.from({ length: 10 }, (_, i) => ({
      id: String(i + 1),
      title: `Notification ${i + 1}`,
      message: `Message ${i + 1}`,
      type: ['success', 'info', 'warning'][i % 3] as any,
      timestamp: new Date(Date.now() - i * 600000).toISOString(),
      read: false,
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
