/**
 * Tests for ClientDashboard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ClientDashboard } from '../ClientDashboard';
import { useApi } from '@/hooks/useApi';

// Mock useApi hook
vi.mock('@/hooks/useApi', () => ({
  useApi: vi.fn(),
}));

describe('ClientDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useApi as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<ClientDashboard />);

    // Should show loading skeletons
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders error state', () => {
    (useApi as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to load'),
    });

    render(<ClientDashboard />);

    expect(screen.getByText(/Failed to load dashboard statistics/i)).toBeInTheDocument();
  });

  it('renders dashboard stats', async () => {
    const mockStats = {
      total_orders: 10,
      pending_orders: 2,
      completed_orders: 8,
      total_invoices: 15,
      pending_invoices: 3,
      paid_invoices: 12,
      total_projects: 5,
      active_projects: 3,
      open_tickets: 1,
      total_spent: '5000.00',
      pending_amount: '500.00',
    };

    (useApi as any).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    render(<ClientDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // total_orders
      expect(screen.getByText('15')).toBeInTheDocument(); // total_invoices
    });
  });

  it('displays financial overview', () => {
    const mockStats = {
      total_orders: 0,
      pending_orders: 0,
      completed_orders: 0,
      total_invoices: 0,
      pending_invoices: 0,
      paid_invoices: 0,
      total_projects: 0,
      active_projects: 0,
      open_tickets: 0,
      total_spent: '1000.00',
      pending_amount: '200.00',
    };

    (useApi as any).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    render(<ClientDashboard />);

    expect(screen.getByText('$1,000.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });
});
