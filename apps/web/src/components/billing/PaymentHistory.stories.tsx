/**
 * PaymentHistory Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import PaymentHistory from './PaymentHistory';
import type { Payment } from './PaymentHistory';

const meta: Meta<typeof PaymentHistory> = {
  title: 'Billing/PaymentHistory',
  component: PaymentHistory,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof PaymentHistory>;

const samplePayments: Payment[] = [
  {
    id: '1',
    date: '2024-03-15T10:30:00Z',
    amount: 149.0,
    currency: 'USD',
    status: 'completed',
    description: 'Monthly Subscription',
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'txn_1234567890',
  },
  {
    id: '2',
    date: '2024-02-15T10:30:00Z',
    amount: 99.0,
    currency: 'USD',
    status: 'completed',
    description: 'Monthly Subscription',
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'txn_0987654321',
  },
  {
    id: '3',
    date: '2024-01-15T10:30:00Z',
    amount: 99.0,
    currency: 'USD',
    status: 'failed',
    description: 'Monthly Subscription',
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'txn_failed123',
  },
];

export const Default: Story = {
  args: {
    payments: samplePayments,
    onDownloadReceipt: (payment) => console.log('Download receipt:', payment),
  },
};

export const Empty: Story = {
  args: {
    payments: [],
    onDownloadReceipt: (payment) => console.log('Download receipt:', payment),
  },
};

export const SinglePayment: Story = {
  args: {
    payments: [samplePayments[0]],
    onDownloadReceipt: (payment) => console.log('Download receipt:', payment),
  },
};
