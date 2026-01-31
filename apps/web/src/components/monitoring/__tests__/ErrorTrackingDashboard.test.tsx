/**
 * ErrorTrackingDashboard Component Tests
 *
 * Comprehensive test suite for the ErrorTrackingDashboard component covering:
 * - Error statistics display
 * - Recent errors list
 * - Refresh functionality
 * - Clear errors action
 * - Loading states
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import ErrorTrackingDashboard from '../ErrorTrackingDashboard';

// Mock hooks and services
vi.mock('@/hooks/monitoring/useErrorTracking', () => ({
  useErrorTracking: vi.fn(() => ({
    errors: [],
    stats: {
      totalErrors: 0,
      errorsLast24h: 0,
      errorsLast7d: 0,
      errorsByLevel: { error: 0, warning: 0, info: 0 },
    },
    isLoading: false,
    refresh: vi.fn(),
  })),
}));

vi.mock('@/services/errorStatisticsService', () => ({
  ErrorStatisticsService: {
    getRecentErrors: vi.fn(() => []),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.confirm
window.confirm = vi.fn(() => true);

describe('ErrorTrackingDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders error tracking dashboard', () => {
      render(<ErrorTrackingDashboard />);
      expect(screen.getByText(/error tracking/i)).toBeInTheDocument();
    });

    it('displays error statistics', () => {
      render(<ErrorTrackingDashboard />);
      expect(screen.getByText(/total errors/i)).toBeInTheDocument();
    });

    it('shows loading state', () => {
      const { useErrorTracking } = require('@/hooks/monitoring/useErrorTracking');
      useErrorTracking.mockReturnValue({
        errors: [],
        stats: { totalErrors: 0 },
        isLoading: true,
        refresh: vi.fn(),
      });
      render(<ErrorTrackingDashboard />);
      // Should show loading spinner
      expect(screen.getByRole('progressbar') || screen.getByText(/loading/i)).toBeTruthy();
    });
  });

  describe('Actions', () => {
    it('calls refresh when refresh button is clicked', () => {
      const mockRefresh = vi.fn();
      const { useErrorTracking } = require('@/hooks/monitoring/useErrorTracking');
      useErrorTracking.mockReturnValue({
        errors: [],
        stats: { totalErrors: 0 },
        isLoading: false,
        refresh: mockRefresh,
      });
      render(<ErrorTrackingDashboard />);
      const refreshButton = screen.getByText(/refresh/i);
      fireEvent.click(refreshButton);
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('clears errors when clear button is clicked', () => {
      render(<ErrorTrackingDashboard />);
      const clearButton = screen.getByText(/clear/i);
      fireEvent.click(clearButton);
      expect(window.confirm).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('error_tracking');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<ErrorTrackingDashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
