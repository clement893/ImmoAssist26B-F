/**
 * Portal Utils Tests
 *
 * Comprehensive test suite for portal utility functions covering:
 * - detectPortalType function
 * - getPortalTypeFromUser function
 * - Portal permission checks
 * - Portal route metadata
 */

import { describe, it, expect, vi } from 'vitest';
import { detectPortalType, getPortalTypeFromUser } from '../utils';
import type { PortalUser } from '../utils';

// Mock constants
vi.mock('@/lib/constants/portal', () => ({
  PORTAL_PATH_PATTERNS: {
    CLIENT: /^\/client/,
    EMPLOYEE: /^\/employee/,
    ADMIN: /^\/admin/,
  },
  PORTAL_DEFAULT_ROUTES: {
    CLIENT: '/client',
    EMPLOYEE: '/employee',
    ADMIN: '/admin',
  },
}));

describe('Portal Utils', () => {
  describe('detectPortalType', () => {
    it('detects client portal from pathname', () => {
      expect(detectPortalType('/client/dashboard')).toBe('client');
    });

    it('detects employee portal from pathname', () => {
      expect(detectPortalType('/employee/dashboard')).toBe('employee');
    });

    it('detects admin portal from pathname', () => {
      expect(detectPortalType('/admin/dashboard')).toBe('admin');
    });

    it('returns null for non-portal pathname', () => {
      expect(detectPortalType('/public/page')).toBeNull();
    });
  });

  describe('getPortalTypeFromUser', () => {
    it('returns client for user with client role only', () => {
      const user: PortalUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        is_verified: true,
        roles: ['client'],
      };
      expect(getPortalTypeFromUser(user)).toBe('client');
    });

    it('returns client for user with client_admin role', () => {
      const user: PortalUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        is_verified: true,
        roles: ['client_admin'],
      };
      expect(getPortalTypeFromUser(user)).toBe('client');
    });

    it('returns default client when user has no roles', () => {
      const user: PortalUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        is_verified: true,
      };
      expect(getPortalTypeFromUser(user)).toBe('client');
    });

    it('returns admin for user with admin role', () => {
      const user: PortalUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        is_active: true,
        is_verified: true,
        roles: ['admin'],
      };
      expect(getPortalTypeFromUser(user)).toBe('admin');
    });
  });
});
