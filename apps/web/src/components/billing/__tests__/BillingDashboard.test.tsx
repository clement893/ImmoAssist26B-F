/**
 * BillingDashboard Component Tests
 *
 * Comprehensive test suite for the BillingDashboard component covering:
 * - Rendering subscription information
 * - Usage metrics display
 * - Upcoming invoice display
 * - Payment method display
 * - Chart rendering
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import BillingDashboard from '../BillingDashboard';

// Mock Chart component
vi.mock('@/components/ui', () => ({
  Chart: ({ data }: { data: unknown[] }) => (
    <div data-testid="chart">{data.length} data points</div>
  ),
}));

describe('BillingDashboard Component', () => {
  const mockSubscription = {
    plan: 'Pro',
    status: 'active' as const,
    currentPeriodEnd: '2024-04-15',
    amount: 29,
    currency: 'USD',
  };

  const mockUsage = {
    current: 750,
    limit: 1000,
    unit: 'API calls',
  };

  const mockUpcomingInvoice = {
    amount: 29,
    currency: 'USD',
    date: '2024-04-15',
  };

  const mockPaymentMethod = {
    type: 'card',
    last4: '4242',
    brand: 'visa',
  };

  describe('Rendering', () => {
    it('renders subscription information', () => {
      render(<BillingDashboard subscription={mockSubscription} />);
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText(/29/)).toBeInTheDocument();
    });

    it('renders usage metrics', () => {
      render(<BillingDashboard usage={mockUsage} />);
      expect(screen.getByText(/750/)).toBeInTheDocument();
      expect(screen.getByText(/1000/)).toBeInTheDocument();
      expect(screen.getByText(/API calls/)).toBeInTheDocument();
    });

    it('renders upcoming invoice', () => {
      render(<BillingDashboard upcomingInvoice={mockUpcomingInvoice} />);
      expect(screen.getByText(/29/)).toBeInTheDocument();
    });

    it('renders payment method', () => {
      render(<BillingDashboard paymentMethod={mockPaymentMethod} />);
      expect(screen.getByText(/4242/)).toBeInTheDocument();
      expect(screen.getByText(/visa/i)).toBeInTheDocument();
    });

    it('renders all sections together', () => {
      render(
        <BillingDashboard
          subscription={mockSubscription}
          usage={mockUsage}
          upcomingInvoice={mockUpcomingInvoice}
          paymentMethod={mockPaymentMethod}
        />
      );
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText(/750/)).toBeInTheDocument();
      expect(screen.getByText(/4242/)).toBeInTheDocument();
    });
  });

  describe('Subscription Status', () => {
    it('displays active status badge', () => {
      render(<BillingDashboard subscription={{ ...mockSubscription, status: 'active' }} />);
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });

    it('displays cancelled status badge', () => {
      render(<BillingDashboard subscription={{ ...mockSubscription, status: 'cancelled' }} />);
      expect(screen.getByText(/cancelled/i)).toBeInTheDocument();
    });

    it('displays past_due status badge', () => {
      render(<BillingDashboard subscription={{ ...mockSubscription, status: 'past_due' }} />);
      expect(screen.getByText(/past.due/i)).toBeInTheDocument();
    });

    it('displays trialing status badge', () => {
      render(<BillingDashboard subscription={{ ...mockSubscription, status: 'trialing' }} />);
      expect(screen.getByText(/trialing/i)).toBeInTheDocument();
    });
  });

  describe('Chart Rendering', () => {
    it('renders billing history chart', async () => {
      render(<BillingDashboard subscription={mockSubscription} />);
      await waitFor(() => {
        expect(screen.getByTestId('chart')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles missing subscription', () => {
      render(<BillingDashboard />);
      // Component should still render without errors
      expect(screen.queryByText('Pro')).not.toBeInTheDocument();
    });

    it('handles missing usage', () => {
      render(<BillingDashboard subscription={mockSubscription} />);
      // Component should still render without errors
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('handles zero usage', () => {
      render(<BillingDashboard usage={{ current: 0, limit: 1000, unit: 'calls' }} />);
      expect(screen.getByText(/0/)).toBeInTheDocument();
    });

    it('handles usage at limit', () => {
      render(<BillingDashboard usage={{ current: 1000, limit: 1000, unit: 'calls' }} />);
      expect(screen.getByText(/1000/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <BillingDashboard subscription={mockSubscription} usage={mockUsage} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
