/**
 * PaymentMethodForm Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import PaymentMethodForm from './PaymentMethodForm';

const meta: Meta<typeof PaymentMethodForm> = {
  title: 'Billing/PaymentMethodForm',
  component: PaymentMethodForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PaymentMethodForm>;

export const Default: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Submit payment method:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Cancel clicked'),
  },
};

export const WithExistingCard: Story = {
  args: {
    existingMethod: {
      type: 'card',
      brand: 'Visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
    },
    onSubmit: async (data) => {
      console.log('Update payment method:', data);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onCancel: () => console.log('Cancel clicked'),
  },
};

export const Loading: Story = {
  args: {
    onSubmit: async (data) => {
      console.log('Submit payment method:', data);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    },
    onCancel: () => console.log('Cancel clicked'),
  },
};
