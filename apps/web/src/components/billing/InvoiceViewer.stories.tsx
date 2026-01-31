/**
 * InvoiceViewer Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import InvoiceViewer from './InvoiceViewer';

const meta: Meta<typeof InvoiceViewer> = {
  title: 'Billing/InvoiceViewer',
  component: InvoiceViewer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof InvoiceViewer>;

const sampleInvoice = {
  id: '1',
  number: 'INV-2024-001',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  status: 'paid' as const,
  subtotal: 89.1,
  tax: 9.9,
  total: 99.0,
  currency: 'USD',
  items: [
    {
      description: 'Monthly Subscription - Pro Plan',
      quantity: 1,
      unitPrice: 89.1,
      total: 89.1,
    },
  ],
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St\nNew York, NY 10001',
  },
  company: {
    name: 'Your Company',
    address: '456 Business Ave\nSan Francisco, CA 94102',
    taxId: 'TAX123456789',
  },
};

export const Default: Story = {
  args: {
    invoice: sampleInvoice,
    onBack: () => console.log('Back clicked'),
    onDownload: () => console.log('Download clicked'),
    onPrint: () => console.log('Print clicked'),
  },
};

export const Pending: Story = {
  args: {
    invoice: {
      ...sampleInvoice,
      status: 'pending',
      number: 'INV-2024-003',
    },
    onBack: () => console.log('Back clicked'),
    onDownload: () => console.log('Download clicked'),
    onPrint: () => console.log('Print clicked'),
  },
};

export const MultipleItems: Story = {
  args: {
    invoice: {
      ...sampleInvoice,
      items: [
        {
          description: 'Monthly Subscription - Pro Plan',
          quantity: 1,
          unitPrice: 89.1,
          total: 89.1,
        },
        {
          description: 'Additional Storage (50GB)',
          quantity: 1,
          unitPrice: 10.0,
          total: 10.0,
        },
      ],
      subtotal: 99.1,
      tax: 9.91,
      total: 109.01,
    },
    onBack: () => console.log('Back clicked'),
    onDownload: () => console.log('Download clicked'),
    onPrint: () => console.log('Print clicked'),
  },
};
