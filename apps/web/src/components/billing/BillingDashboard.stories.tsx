/**
 * BillingDashboard Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import BillingDashboard from './BillingDashboard';

const meta: Meta<typeof BillingDashboard> = {
  title: 'Billing/BillingDashboard',
  component: BillingDashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof BillingDashboard>;

export const Default: Story = {
  args: {
    subscription: {
      plan: 'Pro',
      status: 'active',
      currentPeriodEnd: '2024-04-15',
      amount: 29,
      currency: 'USD',
    },
    usage: {
      current: 750,
      limit: 1000,
      unit: 'API calls',
    },
    upcomingInvoice: {
      amount: 29,
      currency: 'USD',
      date: '2024-04-15',
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
  },
};

export const FreePlan: Story = {
  args: {
    subscription: {
      plan: 'Free',
      status: 'active',
      currentPeriodEnd: '2024-04-15',
      amount: 0,
      currency: 'USD',
    },
    usage: {
      current: 50,
      limit: 100,
      unit: 'API calls',
    },
  },
};

export const PastDue: Story = {
  args: {
    subscription: {
      plan: 'Pro',
      status: 'past_due',
      currentPeriodEnd: '2024-04-15',
      amount: 29,
      currency: 'USD',
    },
    usage: {
      current: 950,
      limit: 1000,
      unit: 'API calls',
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
  },
};

export const HighUsage: Story = {
  args: {
    subscription: {
      plan: 'Pro',
      status: 'active',
      currentPeriodEnd: '2024-04-15',
      amount: 29,
      currency: 'USD',
    },
    usage: {
      current: 950,
      limit: 1000,
      unit: 'API calls',
    },
    paymentMethod: {
      type: 'card',
      last4: '4242',
      brand: 'Visa',
    },
  },
};
