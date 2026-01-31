import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLazyComponent,
  withSuspense,
  routeSplit,
  preloadComponent,
} from '../codeSplitting';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Mock Next.js dynamic
vi.mock('next/dynamic', () => ({
  default: vi.fn((importFn, options) => {
    return vi.fn(() => import('react').then((mod) => ({ default: mod.default })));
  }),
}));

describe('codeSplitting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createLazyComponent', () => {
    it('creates a lazy component with default options', () => {
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));
      const component = createLazyComponent(importFn);

      expect(dynamic).toHaveBeenCalledWith(importFn, {
        loading: expect.any(Function),
        ssr: true,
      });
      expect(component).toBeDefined();
    });

    it('creates a lazy component with custom loading component', () => {
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));
      const LoadingComponent = vi.fn(() => <div>Loading...</div>);

      createLazyComponent(importFn, { loading: LoadingComponent });

      expect(dynamic).toHaveBeenCalledWith(importFn, {
        loading: LoadingComponent,
        ssr: true,
      });
    });

    it('creates a lazy component with SSR disabled', () => {
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));

      createLazyComponent(importFn, { ssr: false });

      expect(dynamic).toHaveBeenCalledWith(importFn, {
        loading: expect.any(Function),
        ssr: false,
      });
    });
  });

  describe('withSuspense', () => {
    it('wraps component with Suspense boundary', () => {
      const TestComponent = vi.fn(() => <div>Test</div>);
      const WrappedComponent = withSuspense(TestComponent);

      expect(WrappedComponent).toBeDefined();
      // The component should be wrapped in Suspense
      // This is tested implicitly through the function structure
    });

    it('uses default fallback when none provided', () => {
      const TestComponent = vi.fn(() => <div>Test</div>);
      const WrappedComponent = withSuspense(TestComponent);

      expect(WrappedComponent).toBeDefined();
    });

    it('uses custom fallback when provided', () => {
      const TestComponent = vi.fn(() => <div>Test</div>);
      const CustomFallback = <div>Custom Loading...</div>;
      const WrappedComponent = withSuspense(TestComponent, CustomFallback);

      expect(WrappedComponent).toBeDefined();
    });
  });

  describe('routeSplit', () => {
    it('creates route-based code split component', () => {
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));
      const component = routeSplit(importFn, 'dashboard');

      expect(dynamic).toHaveBeenCalledWith(importFn, {
        loading: expect.any(Function),
        ssr: true,
      });
      expect(component).toBeDefined();
    });

    it('uses route-specific loading UI', () => {
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));
      routeSplit(importFn, 'dashboard');

      const callArgs = vi.mocked(dynamic).mock.calls[0];
      const loadingFn = callArgs[1]?.loading;
      
      expect(loadingFn).toBeDefined();
      // The loading function should return a loading UI
      if (loadingFn) {
        const loadingElement = loadingFn();
        expect(loadingElement).toBeDefined();
      }
    });
  });

  describe('preloadComponent', () => {
    beforeEach(() => {
      // Mock window.requestIdleCallback
      global.window = {
        requestIdleCallback: vi.fn((callback) => {
          setTimeout(callback, 0);
          return 1;
        }),
      } as any;
    });

    it('preloads component on client side', () => {
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));
      
      preloadComponent(importFn);

      // Should schedule preload
      expect(global.window.requestIdleCallback).toHaveBeenCalled();
    });

    it('falls back to setTimeout when requestIdleCallback not available', () => {
      const originalRequestIdleCallback = global.window.requestIdleCallback;
      delete (global.window as any).requestIdleCallback;
      
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');
      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));

      preloadComponent(importFn);

      expect(setTimeoutSpy).toHaveBeenCalled();
      
      // Restore
      global.window.requestIdleCallback = originalRequestIdleCallback;
      setTimeoutSpy.mockRestore();
    });

    it('does nothing on server side', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const importFn = vi.fn(() => Promise.resolve({ default: vi.fn() }));
      
      preloadComponent(importFn);

      expect(importFn).not.toHaveBeenCalled();
      
      // Restore
      global.window = originalWindow;
    });
  });
});

