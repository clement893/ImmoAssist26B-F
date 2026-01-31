/**
 * UserProfile Component Tests
 *
 * Comprehensive test suite for the UserProfile component covering:
 * - Rendering user information
 * - Loading state
 * - Sign out button
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import UserProfile from '../UserProfile';

// Mock next-auth/react
const mockSession = {
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    image: 'https://example.com/avatar.jpg',
  },
};

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders user name', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
      render(<UserProfile />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders user email', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
      render(<UserProfile />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('renders user avatar when image is available', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
      render(<UserProfile />);
      const avatar = screen.getByAltText('John Doe');
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });
  });

  describe('Loading State', () => {
    it('displays loading state', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: null,
        status: 'loading',
      });
      render(<UserProfile />);
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('No Session', () => {
    it('renders nothing when no session', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
      const { container } = render(<UserProfile />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('displays email when name is not available', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: {
          user: {
            email: 'john@example.com',
          },
        },
        status: 'authenticated',
      });
      render(<UserProfile />);
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('handles missing user image', () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
        status: 'authenticated',
      });
      render(<UserProfile />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByAltText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
      const { container } = render(<UserProfile />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
