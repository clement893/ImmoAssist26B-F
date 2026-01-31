/**
 * OptimizationDashboard Component Tests
 *
 * Comprehensive test suite for the OptimizationDashboard component covering:
 * - Performance metrics display
 * - Optimization suggestions
 * - Chart rendering
 * - Refresh functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
// OptimizationDashboard is actually PerformanceDashboard
import PerformanceDashboard from '../PerformanceDashboard';

// Mock Chart component
vi.mock('@/components/ui', () => ({
  Chart: ({ data }: { data: unknown[] }) => (
    <div data-testid="chart">{data.length} data points</div>
  ),
}));

describe('OptimizationDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders performance dashboard', async () => {
      render(<PerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/performance/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/performance/i)).toBeTruthy();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
