/**
 * WebhooksSettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import WebhooksSettings from './WebhooksSettings';
import type { Webhook } from './WebhooksSettings';

const meta: Meta<typeof WebhooksSettings> = {
  title: 'Settings/WebhooksSettings',
  component: WebhooksSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof WebhooksSettings>;

const sampleWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Payment Webhook',
    url: 'https://example.com/webhooks/payment',
    events: ['payment.succeeded', 'payment.failed'],
    secret: 'whsec_1234567890',
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastTriggered: '2024-03-20T14:30:00Z',
  },
  {
    id: '2',
    name: 'User Events',
    url: 'https://example.com/webhooks/users',
    events: ['user.created', 'user.updated'],
    secret: 'whsec_abcdef123456',
    active: false,
    createdAt: '2024-02-01T10:00:00Z',
  },
];

export const Default: Story = {
  args: {
    webhooks: sampleWebhooks,
    onCreate: async (data) => {
      console.log('Create webhook:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onUpdate: async (id, data) => {
      console.log('Update webhook:', { id, data });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async (id) => {
      console.log('Delete webhook:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onToggle: async (id, active) => {
      console.log('Toggle webhook:', { id, active });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    webhooks: [],
    onCreate: async (data) => {
      console.log('Create webhook:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onUpdate: async (id, data) => {
      console.log('Update webhook:', { id, data });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async (id) => {
      console.log('Delete webhook:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onToggle: async (id, active) => {
      console.log('Toggle webhook:', { id, active });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const SingleWebhook: Story = {
  args: {
    webhooks: [sampleWebhooks[0]],
    onCreate: async (data) => {
      console.log('Create webhook:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onUpdate: async (id, data) => {
      console.log('Update webhook:', { id, data });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDelete: async (id) => {
      console.log('Delete webhook:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onToggle: async (id, active) => {
      console.log('Toggle webhook:', { id, active });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
