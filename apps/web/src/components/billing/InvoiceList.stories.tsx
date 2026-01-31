/**
 * InvoiceList Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react';
import InvoiceList from './InvoiceList';
import type { Invoice } from './InvoiceList';

const meta: Meta<typeof InvoiceList> = {
  title: 'Billing/InvoiceList',
  component: InvoiceList,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof InvoiceList>;

const sampleInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-2024-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 99.0,
    currency: 'USD',
    status: 'paid',
    description: 'Monthly Subscription',
    paymentMethod: 'Visa •••• 4242',
  },
  {
    id: '2',
    number: 'INV-2024-002',
    date: '2024-02-15',
    dueDate: '2024-03-15',
    amount: 99.0,
    currency: 'USD',
    status: 'paid',
    description: 'Monthly Subscription',
  },
  {
    id: '3',
    number: 'INV-2024-003',
    date: '2024-03-15',
    dueDate: '2024-04-15',
    amount: 149.0,
    currency: 'USD',
    status: 'pending',
    description: 'Monthly Subscription (Upgraded)',
  },
  {
    id: '4',
    number: 'INV-2024-004',
    date: '2024-02-01',
    dueDate: '2024-02-15',
    amount: 99.0,
    currency: 'USD',
    status: 'overdue',
    description: 'Monthly Subscription',
  },
];

export const Default: Story = {
  args: {
    invoices: sampleInvoices,
    onViewInvoice: (invoice) => console.log('View invoice:', invoice),
    onDownloadInvoice: (invoice) => console.log('Download invoice:', invoice),
  },
};

export const Empty: Story = {
  args: {
    invoices: [],
    onViewInvoice: (invoice) => console.log('View invoice:', invoice),
    onDownloadInvoice: (invoice) => console.log('Download invoice:', invoice),
  },
};

export const SingleInvoice: Story = {
  args: {
    invoices: [sampleInvoices[0]],
    onViewInvoice: (invoice) => console.log('View invoice:', invoice),
    onDownloadInvoice: (invoice) => console.log('Download invoice:', invoice),
  },
};
