/**
 * UserSettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import UserSettings from './UserSettings';

const meta: Meta<typeof UserSettings> = {
  title: 'Settings/UserSettings',
  component: UserSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof UserSettings>;

const sampleUser = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  bio: 'Software developer passionate about building great products.',
  location: 'New York, NY',
  website: 'https://johndoe.com',
  avatarUrl: undefined,
};

export const Default: Story = {
  args: {
    user: sampleUser,
    onSave: async (data) => {
      console.log('Save user settings:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onAvatarChange: async (file) => {
      console.log('Avatar changed:', file.name);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const MinimalUser: Story = {
  args: {
    user: {
      id: '1',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    onSave: async (data) => {
      console.log('Save user settings:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithAvatar: Story = {
  args: {
    user: {
      ...sampleUser,
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
    },
    onSave: async (data) => {
      console.log('Save user settings:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onAvatarChange: async (file) => {
      console.log('Avatar changed:', file.name);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
