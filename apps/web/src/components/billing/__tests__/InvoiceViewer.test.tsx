/**
 * InvoiceViewer Component Tests
 *
 * Comprehensive test suite for the InvoiceViewer component covering:
 * - Rendering invoice details
 * - Invoice items display
 * - Back/download/print actions
 * - Status badges
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import InvoiceViewer, { type InvoiceItem } from '../InvoiceViewer';

const mockInvoice = {
  id: '1',
  number: 'INV-001',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  status: 'paid' as const,
  subtotal: 100,
  tax: 10,
  total: 110,
  currency: 'USD',
  items: [
    { description: 'Item 1', quantity: 1, unitPrice: 50, total: 50 },
    { description: 'Item 2', quantity: 2, unitPrice: 25, total: 50 },
  ] as InvoiceItem[],
  customer: {
    name: 'John Doe',
    email: 'john@example.com',
    address: '123 Main St',
  },
  company: {
    name: 'Acme Corp',
    address: '456 Business Ave',
    taxId: 'TAX123',
  },
};

describe('InvoiceViewer Component', () => {
  describe('Rendering', () => {
    it('renders invoice number', () => {
      render(<InvoiceViewer invoice={mockInvoice} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    it('renders invoice date', () => {
      render(<InvoiceViewer invoice={mockInvoice} />);
      expect(screen.getByText(/2024-01-15/)).toBeInTheDocument();
    });

    it('renders invoice total', () => {
      render(<InvoiceViewer invoice={mockInvoice} />);
      expect(screen.getByText(/110/)).toBeInTheDocument();
    });

    it('renders invoice items', () => {
      render(<InvoiceViewer invoice={mockInvoice} />);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('renders customer information', () => {
      render(<InvoiceViewer invoice={mockInvoice} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders company information', () => {
      render(<InvoiceViewer invoice={mockInvoice} />);
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('displays paid status badge', () => {
      render(<InvoiceViewer invoice={{ ...mockInvoice, status: 'paid' }} />);
      expect(screen.getByText(/paid/i)).toBeInTheDocument();
    });

    it('displays pending status badge', () => {
      render(<InvoiceViewer invoice={{ ...mockInvoice, status: 'pending' }} />);
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    it('displays overdue status badge', () => {
      render(<InvoiceViewer invoice={{ ...mockInvoice, status: 'overdue' }} />);
      expect(screen.getByText(/overdue/i)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onBack when back button is clicked', () => {
      const handleBack = vi.fn();
      render(<InvoiceViewer invoice={mockInvoice} onBack={handleBack} />);
      const backButton = screen.getByText(/back to invoices/i);
      fireEvent.click(backButton);
      expect(handleBack).toHaveBeenCalled();
    });

    it('calls onDownload when download button is clicked', () => {
      const handleDownload = vi.fn();
      render(<InvoiceViewer invoice={mockInvoice} onDownload={handleDownload} />);
      const downloadButton = screen.getByText(/download pdf/i);
      fireEvent.click(downloadButton);
      expect(handleDownload).toHaveBeenCalled();
    });

    it('calls onPrint when print button is clicked', () => {
      const handlePrint = vi.fn();
      render(<InvoiceViewer invoice={mockInvoice} onPrint={handlePrint} />);
      const printButton = screen.getByText(/print/i);
      fireEvent.click(printButton);
      expect(handlePrint).toHaveBeenCalled();
    });

    it('calls window.print when print button is clicked without onPrint', () => {
      const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      render(<InvoiceViewer invoice={mockInvoice} />);
      const printButton = screen.getByText(/print/i);
      fireEvent.click(printButton);
      expect(printSpy).toHaveBeenCalled();
      printSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles invoice without customer', () => {
      const invoiceWithoutCustomer = { ...mockInvoice, customer: undefined };
      render(<InvoiceViewer invoice={invoiceWithoutCustomer} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    it('handles invoice without company', () => {
      const invoiceWithoutCompany = { ...mockInvoice, company: undefined };
      render(<InvoiceViewer invoice={invoiceWithoutCompany} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });

    it('handles empty invoice items', () => {
      const invoiceWithoutItems = { ...mockInvoice, items: [] };
      render(<InvoiceViewer invoice={invoiceWithoutItems} />);
      expect(screen.getByText('INV-001')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<InvoiceViewer invoice={mockInvoice} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
