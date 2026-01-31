/**
 * IntegrationConfig Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import IntegrationConfig from './IntegrationConfig';

const meta: Meta<typeof IntegrationConfig> = {
  title: 'Integrations/IntegrationConfig',
  component: IntegrationConfig,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof IntegrationConfig>;

export const Default: Story = {
  args: {
    integration: {
      id: '1',
      name: 'Stripe',
      description: 'Accept payments and manage subscriptions',
      category: 'payment',
    },
    fields: [
      {
        id: 'api_key',
        label: 'API Key',
        type: 'password',
        value: '',
        required: true,
        placeholder: 'Enter your API key',
        sensitive: true,
      },
      {
        id: 'api_secret',
        label: 'API Secret',
        type: 'password',
        value: '',
        required: true,
        placeholder: 'Enter your API secret',
        sensitive: true,
      },
    ],
    onSave: async (config) => {
      console.log('Save config:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Cancel'),
    onTest: async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    },
  },
};

export const NoFields: Story = {
  args: {
    integration: {
      id: '1',
      name: 'Simple Integration',
      description: 'No configuration required',
      category: 'other',
    },
    fields: [],
    onSave: async (config) => {
      console.log('Save config:', config);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Cancel'),
  },
};
