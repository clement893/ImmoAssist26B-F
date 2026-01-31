/**
 * NotificationSettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import NotificationSettings from './NotificationSettings';

const meta: Meta<typeof NotificationSettings> = {
  title: 'Settings/NotificationSettings',
  component: NotificationSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof NotificationSettings>;

const defaultSettings = {
  email: {
    enabled: true,
    types: {
      marketing: true,
      security: true,
      updates: false,
    },
  },
  push: {
    enabled: true,
    types: {
      marketing: false,
      security: true,
      updates: true,
    },
  },
  inApp: {
    enabled: true,
    types: {
      marketing: true,
      security: true,
      updates: true,
    },
  },
};

export const Default: Story = {
  args: {
    settings: defaultSettings,
    onSave: async (settings) => {
      console.log('Save notification settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const AllDisabled: Story = {
  args: {
    settings: {
      email: { enabled: false, types: { marketing: false, security: false, updates: false } },
      push: { enabled: false, types: { marketing: false, security: false, updates: false } },
      inApp: { enabled: false, types: { marketing: false, security: false, updates: false } },
    },
    onSave: async (settings) => {
      console.log('Save notification settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const EmailOnly: Story = {
  args: {
    settings: {
      email: { enabled: true, types: { marketing: true, security: true, updates: true } },
      push: { enabled: false, types: { marketing: false, security: false, updates: false } },
      inApp: { enabled: false, types: { marketing: false, security: false, updates: false } },
    },
    onSave: async (settings) => {
      console.log('Save notification settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
