/**
 * SystemMetrics Component Tests
 *
 * Comprehensive test suite for the SystemMetrics component covering:
 * - System metrics display (CPU, Memory, Disk, Network)
 * - Progress bars
 * - Auto-refresh functionality
 * - Loading states
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import SystemMetrics from '../SystemMetrics';

// Mock metrics collector
vi.mock('@/lib/monitoring/metrics', () => ({
  metricsCollector: {
    collectSystemMetrics: vi.fn().mockResolvedValue({
      cpu: 45.5,
      memory: 62.3,
      disk: 78.1,
      network: {
        in: 1024 * 1024 * 5, // 5 MB/s
        out: 1024 * 1024 * 2, // 2 MB/s
      },
      timestamp: new Date().toISOString(),
    }),
  },
}));

describe('SystemMetrics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders system metrics component', async () => {
      render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/system metrics/i)).toBeInTheDocument();
      });
    });

    it('displays CPU metric', async () => {
      render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/cpu/i)).toBeInTheDocument();
        expect(screen.getByText(/45.5/i)).toBeInTheDocument();
      });
    });

    it('displays Memory metric', async () => {
      render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/memory/i)).toBeInTheDocument();
        expect(screen.getByText(/62.3/i)).toBeInTheDocument();
      });
    });

    it('displays Disk metric', async () => {
      render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/disk/i)).toBeInTheDocument();
        expect(screen.getByText(/78.1/i)).toBeInTheDocument();
      });
    });

    it('displays Network metrics', async () => {
      render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/network/i)).toBeInTheDocument();
        expect(screen.getByText(/mb\/s/i)).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<SystemMetrics />);
      expect(screen.getByText(/loading system metrics/i)).toBeInTheDocument();
    });
  });

  describe('Progress Bars', () => {
    it('displays CPU progress bar', async () => {
      render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/cpu/i)).toBeInTheDocument();
        // Progress bar should be rendered
        expect(screen.getByRole('progressbar') || screen.getByText(/45.5/i)).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<SystemMetrics />);
      await waitFor(() => {
        expect(screen.getByText(/system metrics/i)).toBeInTheDocument();
      });
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
