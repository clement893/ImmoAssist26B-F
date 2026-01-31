/**
 * PrivacySettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import PrivacySettings from './PrivacySettings';

const meta: Meta<typeof PrivacySettings> = {
  title: 'Settings/PrivacySettings',
  component: PrivacySettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PrivacySettings>;

const defaultSettings = {
  profileVisibility: 'public',
  dataSharing: true,
  analytics: true,
  marketingEmails: true,
  cookieConsent: true,
};

export const Default: Story = {
  args: {
    settings: defaultSettings,
    onSave: async (settings) => {
      console.log('Save privacy settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onExportData: async () => {
      console.log('Export data');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
    onDeleteAccount: async () => {
      console.log('Delete account');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};

export const PrivateProfile: Story = {
  args: {
    settings: {
      ...defaultSettings,
      profileVisibility: 'private',
    },
    onSave: async (settings) => {
      console.log('Save privacy settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onExportData: async () => {
      console.log('Export data');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
    onDeleteAccount: async () => {
      console.log('Delete account');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};

export const MinimalDataSharing: Story = {
  args: {
    settings: {
      ...defaultSettings,
      dataSharing: false,
      analytics: false,
      marketingEmails: false,
    },
    onSave: async (settings) => {
      console.log('Save privacy settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onExportData: async () => {
      console.log('Export data');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
    onDeleteAccount: async () => {
      console.log('Delete account');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    },
  },
};
