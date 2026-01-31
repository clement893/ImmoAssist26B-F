/**
 * IntegrationList Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import IntegrationList from './IntegrationList';
import type { Integration } from './IntegrationList';

const meta: Meta<typeof IntegrationList> = {
  title: 'Integrations/IntegrationList',
  component: IntegrationList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof IntegrationList>;

const sampleIntegrations: Integration[] = [
  {
    id: '1',
    name: 'Stripe',
    description: 'Accept payments and manage subscriptions',
    category: 'payment',
    status: 'connected',
    connectedAt: '2024-01-15T10:00:00Z',
    websiteUrl: 'https://stripe.com',
  },
  {
    id: '2',
    name: 'SendGrid',
    description: 'Email delivery service',
    category: 'communication',
    status: 'connected',
    connectedAt: '2024-02-01T10:00:00Z',
    websiteUrl: 'https://sendgrid.com',
  },
  {
    id: '3',
    name: 'AWS S3',
    description: 'Cloud storage for files and media',
    category: 'storage',
    status: 'available',
    websiteUrl: 'https://aws.amazon.com/s3',
  },
];

export const Default: Story = {
  args: {
    integrations: sampleIntegrations,
    onConnect: async (integration) => {
      console.log('Connect:', integration);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDisconnect: async (integration) => {
      console.log('Disconnect:', integration);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onConfigure: (integration) => console.log('Configure:', integration),
  },
};

export const Empty: Story = {
  args: {
    integrations: [],
    onConnect: async (integration) => {
      console.log('Connect:', integration);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
