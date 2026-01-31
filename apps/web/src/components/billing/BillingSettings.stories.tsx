/**
 * BillingSettings Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import BillingSettings from './BillingSettings';

const meta: Meta<typeof BillingSettings> = {
  title: 'Billing/BillingSettings',
  component: BillingSettings,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof BillingSettings>;

const defaultSettings = {
  autoRenewal: true,
  emailNotifications: true,
  invoiceEmail: 'billing@example.com',
  taxId: 'TAX123456789',
  billingAddress: {
    line1: '123 Main Street',
    line2: 'Suite 100',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'United States',
  },
  currency: 'USD',
  language: 'en',
};

export const Default: Story = {
  args: {
    settings: defaultSettings,
    onSave: async (settings) => {
      console.log('Save settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const AutoRenewalDisabled: Story = {
  args: {
    settings: {
      ...defaultSettings,
      autoRenewal: false,
    },
    onSave: async (settings) => {
      console.log('Save settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};

export const MinimalSettings: Story = {
  args: {
    settings: {
      autoRenewal: true,
      emailNotifications: false,
      currency: 'USD',
      language: 'en',
    },
    onSave: async (settings) => {
      console.log('Save settings:', settings);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
  },
};
