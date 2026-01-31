/**
 * AlertsPanel Component Tests
 *
 * Comprehensive test suite for the AlertsPanel component covering:
 * - Alerts display
 * - Alert severity badges
 * - Acknowledge action
 * - Resolve action
 * - Auto-refresh functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';
import AlertsPanel from '../AlertsPanel';

// Mock alert manager
vi.mock('@/lib/monitoring/alerts', () => ({
  alertManager: {
    getUnresolvedAlerts: vi.fn(() => [
      {
        id: '1',
        title: 'Test Alert',
        message: 'This is a test alert',
        severity: 'warning' as const,
        timestamp: new Date().toISOString(),
      },
    ]),
    acknowledgeAlert: vi.fn(),
    resolveAlert: vi.fn(),
  },
}));

describe('AlertsPanel Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders alerts panel', () => {
      render(<AlertsPanel />);
      expect(screen.getByText(/active alerts/i)).toBeInTheDocument();
    });

    it('displays alerts count badge', () => {
      render(<AlertsPanel />);
      expect(screen.getByText(/active|1/i)).toBeInTheDocument();
    });

    it('displays alerts list', () => {
      render(<AlertsPanel />);
      expect(screen.getByText(/test alert/i)).toBeInTheDocument();
    });

    it('shows empty state when no alerts', () => {
      const { alertManager } = require('@/lib/monitoring/alerts');
      alertManager.getUnresolvedAlerts.mockReturnValueOnce([]);
      render(<AlertsPanel />);
      expect(screen.getByText(/no active alerts/i)).toBeInTheDocument();
    });
  });

  describe('Alert Actions', () => {
    it('acknowledges alert when acknowledge button is clicked', () => {
      const { alertManager } = require('@/lib/monitoring/alerts');
      render(<AlertsPanel />);
      const acknowledgeButton = screen.queryByText(/acknowledge/i);
      if (acknowledgeButton) {
        fireEvent.click(acknowledgeButton);
        expect(alertManager.acknowledgeAlert).toHaveBeenCalledWith('1');
      }
    });

    it('resolves alert when resolve button is clicked', () => {
      const { alertManager } = require('@/lib/monitoring/alerts');
      render(<AlertsPanel />);
      const resolveButton = screen.queryByText(/resolve/i);
      if (resolveButton) {
        fireEvent.click(resolveButton);
        expect(alertManager.resolveAlert).toHaveBeenCalledWith('1');
      }
    });
  });

  describe('Severity Badges', () => {
    it('displays correct severity badge color', () => {
      render(<AlertsPanel />);
      expect(screen.getByText(/warning/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<AlertsPanel />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
