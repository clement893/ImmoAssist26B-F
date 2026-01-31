/**
 * PricingCardSimple Component Tests
 *
 * Comprehensive test suite for the PricingCardSimple component covering:
 * - Rendering plan details
 * - Price calculation
 * - Popular badge
 * - Features list
 * - Billing period handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import PricingCardSimple from '../PricingCardSimple';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PricingCardSimple Component', () => {
  const mockPlan = {
    id: 'basic',
    name: 'Basic Plan',
    price: 10,
    period: 'month' as const,
    description: 'Basic features',
    features: ['Feature 1', 'Feature 2', 'Feature 3'],
    buttonText: 'Get Started',
  };

  const mockOnSelect = vi.fn();

  describe('Rendering', () => {
    it('renders plan name', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    it('renders plan description', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.getByText('Basic features')).toBeInTheDocument();
    });

    it('renders all features', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
      expect(screen.getByText('Feature 3')).toBeInTheDocument();
    });

    it('renders button text', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });
  });

  describe('Price Calculation', () => {
    it('displays monthly price for monthly billing', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.getByText('10€')).toBeInTheDocument();
      expect(screen.getByText('/mois')).toBeInTheDocument();
    });

    it('displays discounted monthly price for yearly billing', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="year" onSelect={mockOnSelect} />);
      // 10 * 12 * 0.8 / 12 = 8
      expect(screen.getByText('8€')).toBeInTheDocument();
    });

    it('displays yearly price when billing period is year', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="year" onSelect={mockOnSelect} />);
      // 10 * 12 * 0.8 = 96
      expect(screen.getByText('96€/an')).toBeInTheDocument();
    });
  });

  describe('Popular Badge', () => {
    it('renders popular badge when plan is popular', () => {
      const popularPlan = { ...mockPlan, popular: true };
      render(
        <PricingCardSimple plan={popularPlan} billingPeriod="month" onSelect={mockOnSelect} />
      );
      expect(screen.getByText(/le plus populaire/i)).toBeInTheDocument();
    });

    it('does not render popular badge when plan is not popular', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.queryByText(/le plus populaire/i)).not.toBeInTheDocument();
    });

    it('applies special styling to popular plan', () => {
      const popularPlan = { ...mockPlan, popular: true };
      const { container } = render(
        <PricingCardSimple plan={popularPlan} billingPeriod="month" onSelect={mockOnSelect} />
      );
      const card = container.querySelector('.border-2.border-blue-500');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Link Generation', () => {
    it('generates correct subscription link', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/subscriptions?plan=basic&period=month');
    });

    it('generates correct link for yearly billing', () => {
      render(<PricingCardSimple plan={mockPlan} billingPeriod="year" onSelect={mockOnSelect} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/subscriptions?plan=basic&period=year');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(
        <PricingCardSimple plan={mockPlan} billingPeriod="month" onSelect={mockOnSelect} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Edge Cases', () => {
    it('handles plan with no features', () => {
      const planWithoutFeatures = { ...mockPlan, features: [] };
      render(
        <PricingCardSimple
          plan={planWithoutFeatures}
          billingPeriod="month"
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Basic Plan')).toBeInTheDocument();
    });

    it('handles plan with many features', () => {
      const planWithManyFeatures = {
        ...mockPlan,
        features: Array.from({ length: 20 }, (_, i) => `Feature ${i + 1}`),
      };
      render(
        <PricingCardSimple
          plan={planWithManyFeatures}
          billingPeriod="month"
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 20')).toBeInTheDocument();
    });

    it('handles zero price', () => {
      const freePlan = { ...mockPlan, price: 0 };
      render(<PricingCardSimple plan={freePlan} billingPeriod="month" onSelect={mockOnSelect} />);
      expect(screen.getByText('0€')).toBeInTheDocument();
    });
  });
});
