/**
 * WebhookManager Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import WebhookManager from './WebhookManager';
import type { Webhook } from './WebhookManager';

const meta: Meta<typeof WebhookManager> = {
  title: 'Integrations/WebhookManager',
  component: WebhookManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof WebhookManager>;

const sampleWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Payment Webhook',
    url: 'https://example.com/webhooks/payment',
    events: ['payment.succeeded', 'payment.failed'],
    active: true,
    createdAt: '2024-01-15T10:00:00Z',
    lastTriggered: '2024-03-20T14:30:00Z',
    successCount: 150,
    failureCount: 2,
    lastStatus: 'success',
  },
];

export const Default: Story = {
  args: {
    webhooks: sampleWebhooks,
    onCreate: async (data) => {
      console.log('Create webhook:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: String(Date.now()),
        ...data,
        active: true,
        createdAt: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
      };
    },
    onDelete: async (id) => {
      console.log('Delete webhook:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onToggle: async (id, active) => {
      console.log('Toggle webhook:', { id, active });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onTest: async (id) => {
      console.log('Test webhook:', id);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};

export const Empty: Story = {
  args: {
    webhooks: [],
    onCreate: async (data) => {
      console.log('Create webhook:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        id: String(Date.now()),
        ...data,
        active: true,
        createdAt: new Date().toISOString(),
        successCount: 0,
        failureCount: 0,
      };
    },
  },
};
