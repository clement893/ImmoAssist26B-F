/**
 * Tests for ERPNavigation component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { ERPNavigation } from '../ERPNavigation';
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

describe('ERPNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation items grouped by module', () => {
    (usePathname as any).mockReturnValue('/erp/dashboard');
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: true,
      },
    });

    render(<ERPNavigation />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('highlights active route', () => {
    (usePathname as any).mockReturnValue('/erp/invoices');
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: true,
      },
    });

    const { container } = render(<ERPNavigation />);
    const activeLink = container.querySelector('a[href="/erp/invoices"]');

    expect(activeLink).toHaveClass('bg-primary-100');
  });

  it('groups items by module', () => {
    (usePathname as any).mockReturnValue('/erp/dashboard');
    (useAuthStore as any).mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_admin: true,
      },
    });

    render(<ERPNavigation />);

    // Should render module headers
    expect(screen.getByText('CRM')).toBeInTheDocument();
  });
});
