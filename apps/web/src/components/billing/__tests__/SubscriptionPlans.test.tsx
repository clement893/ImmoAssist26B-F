/**
 * SubscriptionPlans Component Tests
 *
 * Comprehensive test suite for the SubscriptionPlans component covering:
 * - Rendering plans
 * - Billing interval toggle
 * - Plan selection
 * - Current plan highlighting
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'jest-axe';
import SubscriptionPlans, { type SubscriptionPlan } from '../SubscriptionPlans';

const mockPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Basic plan',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      { name: 'Feature 1', included: true },
      { name: 'Feature 2', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pro plan',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      { name: 'Feature 1', included: true },
      { name: 'Feature 2', included: true },
    ],
    popular: true,
  },
];

describe('SubscriptionPlans Component', () => {
  describe('Rendering', () => {
    it('renders all plans', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
    });

    it('renders plan descriptions', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      expect(screen.getByText('Basic plan')).toBeInTheDocument();
      expect(screen.getByText('Pro plan')).toBeInTheDocument();
    });

    it('renders plan prices', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      expect(screen.getByText(/9.99/)).toBeInTheDocument();
      expect(screen.getByText(/29.99/)).toBeInTheDocument();
    });

    it('renders plan features', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
      expect(screen.getByText('Feature 2')).toBeInTheDocument();
    });

    it('highlights popular plan', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      const proPlan = screen.getByText('Pro').closest('.border-2');
      expect(proPlan).toBeInTheDocument();
    });
  });

  describe('Billing Interval Toggle', () => {
    it('toggles between monthly and yearly', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      const toggle = screen.getByRole('button');
      fireEvent.click(toggle);
      // Prices should update for yearly billing
      expect(screen.getByText(/yearly/i)).toBeInTheDocument();
    });

    it('displays monthly prices by default', () => {
      render(<SubscriptionPlans plans={mockPlans} />);
      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
    });
  });

  describe('Plan Selection', () => {
    it('calls onSelectPlan when plan is selected', () => {
      const handleSelect = vi.fn();
      render(<SubscriptionPlans plans={mockPlans} onSelectPlan={handleSelect} />);
      const selectButtons = screen.getAllByRole('button', { name: /select|get started/i });
      fireEvent.click(selectButtons[0]);
      expect(handleSelect).toHaveBeenCalledWith(mockPlans[0]);
    });

    it('highlights current plan', () => {
      render(<SubscriptionPlans plans={mockPlans} currentPlanId="pro" />);
      const proPlan = screen.getByText('Pro').closest('[class*="border"]');
      expect(proPlan).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty plans list', () => {
      render(<SubscriptionPlans plans={[]} />);
      // Component should render without errors
      expect(screen.queryByText('Basic')).not.toBeInTheDocument();
    });

    it('handles plan without features', () => {
      const planWithoutFeatures: SubscriptionPlan = {
        ...mockPlans[0],
        features: [],
      };
      render(<SubscriptionPlans plans={[planWithoutFeatures]} />);
      expect(screen.getByText('Basic')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SubscriptionPlans plans={mockPlans} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
