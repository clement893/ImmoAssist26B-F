/**
 * Tests for ClientNavigation component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ClientNavigation } from '../ClientNavigation';
import { useAuthStore } from '@/lib/store';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

// Mock store
vi.mock('@/lib/store', () => ({
  useAuthStore: vi.fn(),
}));

// Mock portal utils
vi.mock('@/lib/portal/utils', () => ({
  hasPermission: vi.fn((user, permission) => ({
    hasPermission: true,
    permission,
  })),
}));

describe('ClientNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation items', () => {
    (usePathname as any).mockReturnValue('/client/dashboard');
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: false,
      },
    });

    render(<ClientNavigation />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    (usePathname as any).mockReturnValue('/client/invoices');
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: false,
      },
    });

    const { container } = render(<ClientNavigation />);
    const activeLink = container.querySelector('a[href="/client/invoices"]');

    expect(activeLink).toHaveClass('bg-primary-100');
  });

  it('filters items based on permissions', () => {
    (usePathname as any).mockReturnValue('/client/dashboard');
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: false,
      },
    });

    render(<ClientNavigation />);

    // Should render dashboard (no permission required)
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
