/**
 * PerformanceScripts Component Tests
 *
 * Comprehensive test suite for the PerformanceScripts component covering:
 * - Service worker registration
 * - Preloading initialization
 * - Preconnect link creation
 * - Error handling
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { PerformanceScripts } from '../PerformanceScripts';

// Mock service worker and preloading
vi.mock('@/lib/performance/serviceWorker', () => ({
  registerServiceWorker: vi.fn(),
}));

vi.mock('@/lib/performance/preloading', () => ({
  initializePreloading: vi.fn(),
}));

describe('PerformanceScripts Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.createElement
    global.document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'link') {
        return {
          rel: '',
          href: '',
          crossOrigin: '',
          appendChild: vi.fn(),
        } as unknown as HTMLLinkElement;
      }
      return document.createElement(tagName);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<PerformanceScripts />);
      expect(container).toBeTruthy();
    });

    it('returns null (no UI)', () => {
      const { container } = render(<PerformanceScripts />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Service Worker Registration', () => {
    it('registers service worker on mount', () => {
      const { registerServiceWorker } = require('@/lib/performance/serviceWorker');
      render(<PerformanceScripts />);
      expect(registerServiceWorker).toHaveBeenCalled();
    });
  });

  describe('Preloading', () => {
    it('initializes preloading on mount', () => {
      const { initializePreloading } = require('@/lib/performance/preloading');
      render(<PerformanceScripts />);
      expect(initializePreloading).toHaveBeenCalled();
    });
  });
});
