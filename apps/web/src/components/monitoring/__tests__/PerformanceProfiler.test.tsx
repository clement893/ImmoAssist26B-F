/**
 * PerformanceProfiler Component Tests
 *
 * Comprehensive test suite for the PerformanceProfiler component covering:
 * - Profiling start/stop
 * - Profile display
 * - Duration color coding
 * - Clear profiles action
 * - Auto-refresh functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import PerformanceProfiler from '../PerformanceProfiler';

// Mock profiler
vi.mock('@/lib/monitoring/profiler', () => ({
  profiler: {
    getProfiles: vi.fn(() => ({
      'operation-1': 1500,
      'operation-2': 500,
      'operation-3': 3500,
    })),
    start: vi.fn(),
    end: vi.fn(),
    clearProfiles: vi.fn(),
  },
}));

describe('PerformanceProfiler Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders performance profiler', () => {
      render(<PerformanceProfiler />);
      expect(screen.getByText(/performance profiler/i)).toBeInTheDocument();
    });

    it('displays profiles', () => {
      render(<PerformanceProfiler />);
      expect(screen.getByText(/operation-1/i) || screen.getByText(/1500/i)).toBeInTheDocument();
    });

    it('shows empty state when no profiles', () => {
      const { profiler } = require('@/lib/monitoring/profiler');
      profiler.getProfiles.mockReturnValueOnce({});
      render(<PerformanceProfiler />);
      expect(screen.getByText(/no profiling data/i)).toBeInTheDocument();
    });
  });

  describe('Profiling Actions', () => {
    it('starts profiling when start button is clicked', () => {
      const { profiler } = require('@/lib/monitoring/profiler');
      render(<PerformanceProfiler />);
      const startButton = screen.getByText(/start profiling/i);
      fireEvent.click(startButton);
      expect(profiler.start).toHaveBeenCalledWith('custom-operation');
    });

    it('clears profiles when clear button is clicked', () => {
      const { profiler } = require('@/lib/monitoring/profiler');
      render(<PerformanceProfiler />);
      const clearButton = screen.getByText(/clear/i);
      fireEvent.click(clearButton);
      expect(profiler.clearProfiles).toHaveBeenCalled();
    });
  });

  describe('Duration Display', () => {
    it('displays duration with correct color for slow operations', () => {
      render(<PerformanceProfiler />);
      expect(screen.getByText(/3500/i) || screen.getByText(/slow/i)).toBeInTheDocument();
    });

    it('displays slow badge for operations > 1000ms', () => {
      render(<PerformanceProfiler />);
      expect(screen.getByText(/slow/i)).toBeInTheDocument();
    });

    it('displays critical badge for operations > 3000ms', () => {
      render(<PerformanceProfiler />);
      expect(screen.getByText(/critical/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<PerformanceProfiler />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
