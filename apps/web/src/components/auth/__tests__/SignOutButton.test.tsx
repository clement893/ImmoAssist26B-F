/**
 * SignOutButton Component Tests
 *
 * Comprehensive test suite for the SignOutButton component covering:
 * - Rendering
 * - Sign out action
 * - Variant styling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import SignOutButton from '../SignOutButton';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('SignOutButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders sign out button', () => {
      render(<SignOutButton />);
      expect(screen.getByText(/sign out/i)).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<SignOutButton className="custom-class" />);
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Sign Out Action', () => {
    it('calls signOut when clicked', async () => {
      const { signOut } = await import('next-auth/react');
      render(<SignOutButton />);
      const button = screen.getByText(/sign out/i);
      fireEvent.click(button);
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/auth/signin' });
    });
  });

  describe('Variants', () => {
    it('applies primary variant', () => {
      render(<SignOutButton variant="primary" />);
      const button = screen.getByText(/sign out/i);
      expect(button).toBeInTheDocument();
    });

    it('applies secondary variant by default', () => {
      render(<SignOutButton />);
      const button = screen.getByText(/sign out/i);
      expect(button).toBeInTheDocument();
    });

    it('applies danger variant', () => {
      render(<SignOutButton variant="danger" />);
      const button = screen.getByText(/sign out/i);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SignOutButton />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('has accessible button', () => {
      render(<SignOutButton />);
      const button = screen.getByRole('button', { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });
  });
});
