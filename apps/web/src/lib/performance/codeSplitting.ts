/**
 * Code Splitting Utilities
 * Provides utilities for dynamic imports and lazy loading
 */

import React, { ComponentType, ReactNode } from 'react';
import dynamic, { DynamicOptionsLoadingProps } from 'next/dynamic';

type ComponentProps = Record<string, unknown>;

/**
 * Create a lazy-loaded component with loading fallback
 */
export function createLazyComponent<T extends ComponentType<ComponentProps>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    loading?: (loadingProps: DynamicOptionsLoadingProps) => ReactNode;
    ssr?: boolean;
  }
) {
  const LoadingComponent =
    options?.loading || (() => React.createElement('div', null, 'Loading...'));
  return dynamic(importFn, {
    loading: LoadingComponent,
    ssr: options?.ssr !== false,
  });
}

/**
 * Lazy load a component with Suspense boundary
 */
export function withSuspense<T extends ComponentType<ComponentProps>>(
  Component: T,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: React.ComponentProps<T>) {
    return React.createElement(
      React.Suspense,
      { fallback: fallback || React.createElement('div', null, 'Loading...') },
      React.createElement(Component, props)
    );
  };
}

/**
 * Route-based code splitting helper
 * Splits code by route for better performance
 */
export function routeSplit<T extends ComponentType<ComponentProps>>(
  importFn: () => Promise<{ default: T }>,
  _routeName: string
) {
  const LoadingComponent = () =>
    React.createElement(
      'div',
      { className: 'flex items-center justify-center min-h-screen' },
      React.createElement('div', {
        className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500',
      })
    );
  return dynamic(importFn, {
    loading: LoadingComponent,
    ssr: true,
  });
}

/**
 * Preload a component for faster subsequent loads
 */
export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<ComponentProps> }>
) {
  if (typeof window !== 'undefined') {
    // Preload on next idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn();
      });
    } else {
      setTimeout(() => {
        importFn();
      }, 2000);
    }
  }
}
