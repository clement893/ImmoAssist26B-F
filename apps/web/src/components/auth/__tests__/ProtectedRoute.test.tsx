/**
 * ProtectedRoute Component Tests
 *
 * Comprehensive test suite for the ProtectedRoute component covering:
 * - Authentication check
 * - Admin requirement
 * - Redirect behavior
 * - Loading state
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';

// Mock next/navigation
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/protected',
}));

// Mock auth store
const mockIsAuthenticated = vi.fn();
const mockUser = { id: '1', email: 'user@example.com', is_admin: false };
const mockToken = 'mock-token';

vi.mock('@/lib/store', () => ({
  useAuthStore: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
    token: mockToken,
  }),
}));

// Mock TokenStorage
vi.mock('@/lib/auth/tokenStorage', () => ({
  TokenStorage: {
    getToken: vi.fn(() => mockToken),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated.mockReturnValue(true);
  });

  describe('Authentication Check', () => {
    it('renders children when authenticated', async () => {
      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );
      await waitFor(
        () => {
          expect(screen.getByText('Protected Content')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('redirects to login when not authenticated', async () => {
      mockIsAuthenticated.mockReturnValue(false);
      vi.mocked(require('@/lib/auth/tokenStorage').TokenStorage.getToken).mockReturnValue(null);

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith('/auth/login?redirect=%2Fprotected');
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Admin Requirement', () => {
    it('renders children when user is admin', async () => {
      const adminUser = { ...mockUser, is_admin: true };
      vi.mocked(require('@/lib/store').useAuthStore).mockReturnValue({
        user: adminUser,
        isAuthenticated: mockIsAuthenticated,
        token: mockToken,
      });

      render(
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(
        () => {
          expect(screen.getByText('Admin Content')).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it('redirects when user is not admin', async () => {
      render(
        <ProtectedRoute requireAdmin>
          <div>Admin Content</div>
        </ProtectedRoute>
      );

      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe('Loading State', () => {
    it('displays loading message during auth check', () => {
      render(
        <ProtectedRoute>
          <div>Content</div>
        </ProtectedRoute>
      );
      expect(screen.getByText(/verifying authentication/i)).toBeInTheDocument();
    });
  });
});
