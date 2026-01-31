/**
 * APIKeys Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import APIKeys from './APIKeys';
import type { APIKey } from './APIKeys';

const meta: Meta<typeof APIKeys> = {
  title: 'Settings/APIKeys',
  component: APIKeys,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof APIKeys>;

const sampleKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production Key',
    key: 'sk_live_1234567890abcdef',
    scopes: ['read', 'write'],
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'sk_test_abcdef1234567890',
    scopes: ['read'],
    lastUsed: new Date().toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const Default: Story = {
  args: {
    keys: sampleKeys,
    onCreate: async (name, scopes) => {
      console.log('Create API key:', { name, scopes });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRevoke: async (id) => {
      console.log('Revoke API key:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const Empty: Story = {
  args: {
    keys: [],
    onCreate: async (name, scopes) => {
      console.log('Create API key:', { name, scopes });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRevoke: async (id) => {
      console.log('Revoke API key:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const SingleKey: Story = {
  args: {
    keys: [sampleKeys[0]],
    onCreate: async (name, scopes) => {
      console.log('Create API key:', { name, scopes });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRevoke: async (id) => {
      console.log('Revoke API key:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
