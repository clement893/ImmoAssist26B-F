/**
 * SocialAuth Component Tests
 *
 * Comprehensive test suite for the SocialAuth component covering:
 * - Provider rendering
 * - Sign-in flow
 * - Error handling
 * - Loading states
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import SocialAuth, { type SocialProvider } from '../SocialAuth';

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('SocialAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  describe('Rendering', () => {
    it('renders all default providers', () => {
      render(<SocialAuth />);
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with github/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with microsoft/i)).toBeInTheDocument();
    });

    it('renders only specified providers', () => {
      render(<SocialAuth providers={['google']} />);
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.queryByText(/continue with github/i)).not.toBeInTheDocument();
    });

    it('renders "Or continue with email" divider', () => {
      render(<SocialAuth />);
      expect(screen.getByText(/or continue with email/i)).toBeInTheDocument();
    });
  });

  describe('Sign-in Flow', () => {
    it('calls onSignIn callback when provider is clicked', async () => {
      const handleSignIn = vi.fn();
      render(<SocialAuth onSignIn={handleSignIn} />);
      const googleButton = screen.getByText(/continue with google/i).closest('button');
      if (googleButton) {
        fireEvent.click(googleButton);
        await waitFor(() => {
          expect(handleSignIn).toHaveBeenCalledWith('google');
        });
      }
    });

    it('redirects to OAuth URL when provider is clicked', async () => {
      render(<SocialAuth />);
      const googleButton = screen.getByText(/continue with google/i).closest('button');
      if (googleButton) {
        fireEvent.click(googleButton);
        await waitFor(() => {
          expect(mockLocation.href).toContain('/api/v1/auth/oauth/google');
        });
      }
    });
  });

  describe('Loading States', () => {
    it('disables buttons when loading', async () => {
      render(<SocialAuth />);
      const googleButton = screen.getByText(/continue with google/i).closest('button');
      if (googleButton) {
        fireEvent.click(googleButton);
        await waitFor(() => {
          expect(googleButton).toBeDisabled();
        });
      }
    });
  });

  describe('Error Handling', () => {
    it('displays error message when sign-in fails', async () => {
      const handleSignIn = vi.fn().mockRejectedValue(new Error('OAuth failed'));
      render(<SocialAuth onSignIn={handleSignIn} />);
      const googleButton = screen.getByText(/continue with google/i).closest('button');
      if (googleButton) {
        fireEvent.click(googleButton);
        await waitFor(() => {
          expect(screen.getByText(/failed to sign in/i)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Props', () => {
    it('applies custom className', () => {
      const { container } = render(<SocialAuth className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('applies fullWidth when specified', () => {
      const { container } = render(<SocialAuth fullWidth />);
      expect(container.querySelector('.w-full')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SocialAuth />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible buttons', () => {
      render(<SocialAuth />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
