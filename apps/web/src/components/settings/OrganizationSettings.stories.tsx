/**
 * OrganizationSettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import OrganizationSettings from './OrganizationSettings';

const meta: Meta<typeof OrganizationSettings> = {
  title: 'Settings/OrganizationSettings',
  component: OrganizationSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof OrganizationSettings>;

const sampleOrganization = {
  id: '1',
  name: 'Acme Corporation',
  slug: 'acme-corp',
  description: 'Leading provider of innovative solutions',
  website: 'https://acme.com',
  logo: undefined,
  industry: 'Technology',
  size: '50-100',
  timezone: 'America/New_York',
  locale: 'en-US',
};

export const Default: Story = {
  args: {
    organization: sampleOrganization,
    onSave: async (data) => {
      console.log('Save organization settings:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onLogoChange: async (file) => {
      console.log('Logo changed:', file.name);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const MinimalOrganization: Story = {
  args: {
    organization: {
      id: '1',
      name: 'My Company',
      slug: 'my-company',
    },
    onSave: async (data) => {
      console.log('Save organization settings:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const WithLogo: Story = {
  args: {
    organization: {
      ...sampleOrganization,
      logo: 'https://via.placeholder.com/150',
    },
    onSave: async (data) => {
      console.log('Save organization settings:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onLogoChange: async (file) => {
      console.log('Logo changed:', file.name);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
