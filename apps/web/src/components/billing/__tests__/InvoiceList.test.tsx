/**
 * InvoiceList Component Tests
 *
 * Comprehensive test suite for the InvoiceList component covering:
 * - Rendering invoice list
 * - Filtering by status
 * - View/download actions
 * - DataTable integration
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import InvoiceList, { type Invoice } from '../InvoiceList';

const mockInvoices: Invoice[] = [
  {
    id: '1',
    number: 'INV-001',
    date: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 99.99,
    currency: 'USD',
    status: 'paid',
  },
  {
    id: '2',
    number: 'INV-002',
    date: '2024-02-15',
    dueDate: '2024-03-15',
    amount: 149.99,
    currency: 'USD',
    status: 'pending',
  },
  {
    id: '3',
    number: 'INV-003',
    date: '2024-03-15',
    dueDate: '2024-04-15',
    amount: 199.99,
    currency: 'USD',
    status: 'overdue',
  },
];

describe('InvoiceList Component', () => {
  describe('Rendering', () => {
    it('renders invoice list', () => {
      render(<InvoiceList invoices={mockInvoices} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
      expect(screen.getByText('INV-003')).toBeInTheDocument();
    });

    it('renders invoice amounts', () => {
      render(<InvoiceList invoices={mockInvoices} />);
      expect(screen.getByText(/99.99/)).toBeInTheDocument();
      expect(screen.getByText(/149.99/)).toBeInTheDocument();
    });

    it('renders status badges', () => {
      render(<InvoiceList invoices={mockInvoices} />);
      expect(screen.getByText(/paid/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters invoices by status', () => {
      render(<InvoiceList invoices={mockInvoices} />);
      const filterSelect = screen.getByRole('combobox');
      fireEvent.change(filterSelect, { target: { value: 'paid' } });
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.queryByText('INV-002')).not.toBeInTheDocument();
    });

    it('shows all invoices when filter is "all"', () => {
      render(<InvoiceList invoices={mockInvoices} />);
      const filterSelect = screen.getByRole('combobox');
      fireEvent.change(filterSelect, { target: { value: 'all' } });
      expect(screen.getByText('INV-001')).toBeInTheDocument();
      expect(screen.getByText('INV-002')).toBeInTheDocument();
      expect(screen.getByText('INV-003')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onViewInvoice when view button is clicked', () => {
      const handleView = vi.fn();
      render(<InvoiceList invoices={mockInvoices} onViewInvoice={handleView} />);
      const viewButtons = screen.getAllByLabelText(/view invoice/i);
      fireEvent.click(viewButtons[0]);
      expect(handleView).toHaveBeenCalledWith(mockInvoices[0]);
    });

    it('calls onDownloadInvoice when download button is clicked', () => {
      const handleDownload = vi.fn();
      render(<InvoiceList invoices={mockInvoices} onDownloadInvoice={handleDownload} />);
      const downloadButtons = screen.getAllByLabelText(/download invoice/i);
      fireEvent.click(downloadButtons[0]);
      expect(handleDownload).toHaveBeenCalledWith(mockInvoices[0]);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty invoice list', () => {
      render(<InvoiceList invoices={[]} />);
      // Component should render without errors
      expect(screen.queryByText('INV-001')).not.toBeInTheDocument();
    });

    it('handles invoice with description', () => {
      const invoiceWithDesc: Invoice = {
        ...mockInvoices[0],
        description: 'Monthly subscription',
      };
      render(<InvoiceList invoices={[invoiceWithDesc]} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<InvoiceList invoices={mockInvoices} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
