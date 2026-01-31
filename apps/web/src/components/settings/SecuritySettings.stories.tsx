/**
 * SecuritySettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import SecuritySettings from './SecuritySettings';

const meta: Meta<typeof SecuritySettings> = {
  title: 'Settings/SecuritySettings',
  component: SecuritySettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof SecuritySettings>;

export const Default: Story = {
  args: {
    mfaEnabled: false,
    activeSessions: [
      {
        id: '1',
        device: 'Chrome on Windows',
        location: 'New York, US',
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'San Francisco, US',
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        current: false,
      },
    ],
    onEnableMFA: async () => {
      console.log('Enable MFA');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDisableMFA: async () => {
      console.log('Disable MFA');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRevokeSession: async (id) => {
      console.log('Revoke session:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onChangePassword: async (oldPassword, newPassword) => {
      console.log('Change password');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const MFAEnabled: Story = {
  args: {
    mfaEnabled: true,
    activeSessions: [
      {
        id: '1',
        device: 'Chrome on Windows',
        location: 'New York, US',
        lastActive: new Date().toISOString(),
        current: true,
      },
    ],
    onEnableMFA: async () => {
      console.log('Enable MFA');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDisableMFA: async () => {
      console.log('Disable MFA');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRevokeSession: async (id) => {
      console.log('Revoke session:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onChangePassword: async (oldPassword, newPassword) => {
      console.log('Change password');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const MultipleSessions: Story = {
  args: {
    mfaEnabled: true,
    activeSessions: [
      {
        id: '1',
        device: 'Chrome on Windows',
        location: 'New York, US',
        lastActive: new Date().toISOString(),
        current: true,
      },
      {
        id: '2',
        device: 'Safari on iPhone',
        location: 'San Francisco, US',
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        current: false,
      },
      {
        id: '3',
        device: 'Firefox on Mac',
        location: 'London, UK',
        lastActive: new Date(Date.now() - 86400000).toISOString(),
        current: false,
      },
    ],
    onEnableMFA: async () => {
      console.log('Enable MFA');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onDisableMFA: async () => {
      console.log('Disable MFA');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onRevokeSession: async (id) => {
      console.log('Revoke session:', id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onChangePassword: async (oldPassword, newPassword) => {
      console.log('Change password');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
