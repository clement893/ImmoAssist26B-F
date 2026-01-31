/**
 * WebVitalsReporter Component Tests
 *
 * Comprehensive test suite for the WebVitalsReporter component covering:
 * - Web vitals reporting initialization
 * - Environment-based tracking
 * - Component rendering (returns null)
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { WebVitalsReporter } from '../WebVitalsReporter';

// Mock webVitals
vi.mock('@/lib/performance/webVitals', () => ({
  reportWebVitals: vi.fn(),
}));

describe('WebVitalsReporter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<WebVitalsReporter />);
      expect(container).toBeTruthy();
    });

    it('returns null (no UI)', () => {
      const { container } = render(<WebVitalsReporter />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Web Vitals Reporting', () => {
    it('calls reportWebVitals in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { reportWebVitals } = require('@/lib/performance/webVitals');
      render(<WebVitalsReporter />);
      expect(reportWebVitals).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
  });
});
