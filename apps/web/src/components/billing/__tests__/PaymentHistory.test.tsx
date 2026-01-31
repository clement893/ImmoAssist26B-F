/**
 * PaymentHistory Component Tests
 *
 * Comprehensive test suite for the PaymentHistory component covering:
 * - Rendering payment list
 * - Filtering by status and date range
 * - Download receipt action
 * - Status badges
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import PaymentHistory, { type Payment } from '../PaymentHistory';

const mockPayments: Payment[] = [
  {
    id: '1',
    date: '2024-01-15',
    amount: 99.99,
    currency: 'USD',
    status: 'completed',
    description: 'Monthly subscription',
    paymentMethod: 'card',
    transactionId: 'txn_123',
  },
  {
    id: '2',
    date: '2024-02-15',
    amount: 149.99,
    currency: 'USD',
    status: 'pending',
    description: 'Upgrade',
    paymentMethod: 'card',
  },
  {
    id: '3',
    date: '2023-06-15',
    amount: 199.99,
    currency: 'USD',
    status: 'failed',
    description: 'Payment failed',
    paymentMethod: 'card',
  },
];

describe('PaymentHistory Component', () => {
  describe('Rendering', () => {
    it('renders payment list', () => {
      render(<PaymentHistory payments={mockPayments} />);
      expect(screen.getByText(/99.99/)).toBeInTheDocument();
      expect(screen.getByText(/149.99/)).toBeInTheDocument();
    });

    it('renders payment descriptions', () => {
      render(<PaymentHistory payments={mockPayments} />);
      expect(screen.getByText('Monthly subscription')).toBeInTheDocument();
      expect(screen.getByText('Upgrade')).toBeInTheDocument();
    });

    it('renders status badges', () => {
      render(<PaymentHistory payments={mockPayments} />);
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters payments by status', () => {
      render(<PaymentHistory payments={mockPayments} />);
      const statusFilter = screen.getByLabelText(/status/i);
      fireEvent.change(statusFilter, { target: { value: 'completed' } });
      expect(screen.getByText(/99.99/)).toBeInTheDocument();
      expect(screen.queryByText(/149.99/)).not.toBeInTheDocument();
    });

    it('filters payments by date range', () => {
      render(<PaymentHistory payments={mockPayments} />);
      const dateFilter = screen.getByLabelText(/date range/i);
      fireEvent.change(dateFilter, { target: { value: '30days' } });
      // Only recent payments should be visible
      expect(screen.getByText(/99.99/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('calls onDownloadReceipt when download button is clicked', () => {
      const handleDownload = vi.fn();
      render(<PaymentHistory payments={mockPayments} onDownloadReceipt={handleDownload} />);
      const downloadButtons = screen.getAllByLabelText(/download receipt/i);
      fireEvent.click(downloadButtons[0]);
      expect(handleDownload).toHaveBeenCalledWith(mockPayments[0]);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty payment list', () => {
      render(<PaymentHistory payments={[]} />);
      // Component should render without errors
      expect(screen.queryByText(/99.99/)).not.toBeInTheDocument();
    });

    it('handles payment with transaction ID', () => {
      render(<PaymentHistory payments={mockPayments} />);
      expect(screen.getByText(/txn_123/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PaymentHistory payments={mockPayments} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
