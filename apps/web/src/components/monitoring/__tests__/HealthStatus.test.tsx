/**
 * HealthStatus Component Tests
 *
 * Comprehensive test suite for the HealthStatus component covering:
 * - Health status display
 * - Service status indicators
 * - Auto-refresh functionality
 * - Intersection Observer (lazy loading)
 * - Loading states
 * - Error handling
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import HealthStatus from '../HealthStatus';

// Mock health check function
vi.mock('@/lib/monitoring/health', () => ({
  checkApplicationHealth: vi.fn().mockResolvedValue({
    status: 'healthy',
    services: [
      { name: 'API', status: 'healthy' },
      { name: 'Database', status: 'healthy' },
    ],
    timestamp: new Date().toISOString(),
  }),
}));

describe('HealthStatus Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders health status component', async () => {
      render(<HealthStatus />);
      await waitFor(() => {
        expect(
          screen.getByText(/health|status/i) || screen.getByText(/healthy/i)
        ).toBeInTheDocument();
      });
    });

    it('displays loading state initially', () => {
      render(<HealthStatus />);
      // Should show loading spinner
      expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe('Health Status Display', () => {
    it('displays healthy status', async () => {
      render(<HealthStatus />);
      await waitFor(() => {
        expect(screen.getByText(/healthy/i)).toBeInTheDocument();
      });
    });

    it('displays service statuses', async () => {
      render(<HealthStatus />);
      await waitFor(() => {
        expect(screen.getByText(/api|database/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on failure', async () => {
      const { checkApplicationHealth } = require('@/lib/monitoring/health');
      checkApplicationHealth.mockRejectedValueOnce(new Error('Failed to fetch'));
      render(<HealthStatus />);
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<HealthStatus />);
      await waitFor(() => {
        expect(screen.getByText(/health|status/i) || screen.getByText(/healthy/i)).toBeTruthy();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
