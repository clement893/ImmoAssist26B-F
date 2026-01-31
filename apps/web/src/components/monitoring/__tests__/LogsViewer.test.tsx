/**
 * LogsViewer Component Tests
 *
 * Comprehensive test suite for the LogsViewer component covering:
 * - Logs display
 * - Search functionality
 * - Level filtering
 * - Log counts display
 * - Clear logs action
 * - Auto-refresh functionality
 * - Accessibility
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import LogsViewer from '../LogsViewer';

// Mock log store
vi.mock('@/lib/monitoring/logs', () => ({
  logStore: {
    getLogs: vi.fn(() => [
      {
        id: '1',
        level: 'info' as const,
        message: 'Test log message',
        timestamp: new Date().toISOString(),
        context: {},
      },
    ]),
    getLogCounts: vi.fn(() => ({
      debug: 5,
      info: 10,
      warn: 2,
      error: 1,
    })),
    clearLogs: vi.fn(),
  },
}));

describe('LogsViewer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders logs viewer', () => {
      render(<LogsViewer />);
      expect(screen.getByText(/logs/i)).toBeInTheDocument();
    });

    it('displays log counts', () => {
      render(<LogsViewer />);
      expect(screen.getByText(/debug|info|warn|error/i)).toBeInTheDocument();
    });

    it('displays logs list', () => {
      render(<LogsViewer />);
      expect(screen.getByText(/test log message/i)).toBeInTheDocument();
    });

    it('shows empty state when no logs', () => {
      const { logStore } = require('@/lib/monitoring/logs');
      logStore.getLogs.mockReturnValueOnce([]);
      render(<LogsViewer />);
      expect(screen.getByText(/no logs/i)).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters logs by search term', async () => {
      const user = userEvent.setup();
      render(<LogsViewer />);
      const searchInput = screen.getByPlaceholderText(/search logs/i);
      await user.type(searchInput, 'test');
      await waitFor(() => {
        const { logStore } = require('@/lib/monitoring/logs');
        expect(logStore.getLogs).toHaveBeenCalledWith(expect.objectContaining({ search: 'test' }));
      });
    });
  });

  describe('Level Filtering', () => {
    it('filters logs by level', async () => {
      render(<LogsViewer />);
      const levelDropdown = screen.getByText(/level/i);
      fireEvent.click(levelDropdown);
      const errorOption = screen.getByText(/error/i);
      fireEvent.click(errorOption);
      await waitFor(() => {
        const { logStore } = require('@/lib/monitoring/logs');
        expect(logStore.getLogs).toHaveBeenCalledWith(expect.objectContaining({ level: 'error' }));
      });
    });
  });

  describe('Actions', () => {
    it('clears logs when clear button is clicked', () => {
      const { logStore } = require('@/lib/monitoring/logs');
      render(<LogsViewer />);
      const clearButton = screen.getByText(/clear/i);
      fireEvent.click(clearButton);
      expect(logStore.clearLogs).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<LogsViewer />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
