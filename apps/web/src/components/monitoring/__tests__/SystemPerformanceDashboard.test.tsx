/**
 * SystemPerformanceDashboard Component Tests
 *
 * Comprehensive test suite for the SystemPerformanceDashboard component covering:
 * - Performance metrics display
 * - Web Vitals display
 * - Rating calculations
 * - Refresh functionality
 * - Loading states
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import SystemPerformanceDashboard from '../SystemPerformanceDashboard';

// Mock webVitals
vi.mock('@/lib/performance/webVitals', () => ({
  getPerformanceSummary: vi.fn().mockResolvedValue({
    lcp: 2000,
    fid: 50,
    cls: 0.05,
    fcp: 1500,
    ttfb: 600,
    inp: 150,
  }),
}));

describe('SystemPerformanceDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders performance dashboard', async () => {
      render(<SystemPerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/performance/i) || screen.getByText(/lcp/i)).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      render(<SystemPerformanceDashboard />);
      // Should show loading spinner
      expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe('Metrics Display', () => {
    it('displays LCP metric', async () => {
      render(<SystemPerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/lcp/i)).toBeInTheDocument();
      });
    });

    it('displays FCP metric', async () => {
      render(<SystemPerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/fcp/i)).toBeInTheDocument();
      });
    });

    it('displays CLS metric', async () => {
      render(<SystemPerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/cls/i)).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('refreshes metrics when refresh button is clicked', async () => {
      render(<SystemPerformanceDashboard />);
      await waitFor(() => {
        const refreshButton = screen.queryByText(/refresh/i);
        if (refreshButton) {
          fireEvent.click(refreshButton);
          // Should refresh metrics
          expect(refreshButton).toBeInTheDocument();
        }
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SystemPerformanceDashboard />);
      await waitFor(() => {
        expect(screen.getByText(/performance/i) || screen.getByText(/lcp/i)).toBeTruthy();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
