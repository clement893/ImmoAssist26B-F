/**
 * Tests for ERPDashboard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ERPDashboard } from '../ERPDashboard';
import { useApi } from '@/hooks/useApi';

// Mock useApi hook
vi.mock('@/hooks/useApi', () => ({
  useApi: vi.fn(),
}));

describe('ERPDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (useApi as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<ERPDashboard />);

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

    render(<ERPDashboard />);

    expect(screen.getByText(/Failed to load dashboard statistics/i)).toBeInTheDocument();
  });

  it('renders ERP dashboard stats', async () => {
    const mockStats = {
      total_orders: 50,
      pending_orders: 10,
      completed_orders: 40,
      total_invoices: 100,
      pending_invoices: 20,
      paid_invoices: 80,
      total_clients: 25,
      active_clients: 20,
      total_products: 200,
      low_stock_products: 5,
      total_revenue: '50000.00',
      pending_revenue: '5000.00',
    };

    (useApi as any).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    render(<ERPDashboard />);

    await waitFor(() => {
      expect(screen.getByText('50')).toBeInTheDocument(); // total_orders
      expect(screen.getByText('100')).toBeInTheDocument(); // total_invoices
      expect(screen.getByText('25')).toBeInTheDocument(); // total_clients
    });
  });

  it('displays revenue overview', () => {
    const mockStats = {
      total_orders: 0,
      pending_orders: 0,
      completed_orders: 0,
      total_invoices: 0,
      pending_invoices: 0,
      paid_invoices: 0,
      total_clients: 0,
      active_clients: 0,
      total_products: 0,
      low_stock_products: 0,
      total_revenue: '100000.00',
      pending_revenue: '10000.00',
    };

    (useApi as any).mockReturnValue({
      data: mockStats,
      isLoading: false,
      error: null,
    });

    render(<ERPDashboard />);

    expect(screen.getByText('$100,000.00')).toBeInTheDocument();
    expect(screen.getByText('$10,000.00')).toBeInTheDocument();
  });
});
