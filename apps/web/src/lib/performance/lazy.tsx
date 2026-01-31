/**
 * Lazy Loading Utilities
 * Optimize component loading with dynamic imports
 *
 * These utilities provide type-safe lazy loading for React components
 * with proper Suspense boundaries and loading fallbacks.
 */

import { ComponentType, lazy, Suspense, LazyExoticComponent } from 'react';
import Spinner from '@/components/ui/Spinner';

/**
 * Type helper for lazy-loaded components
 * This helps TypeScript understand the component props correctly
 */
type LazyComponentType<T extends ComponentType<unknown>> = LazyExoticComponent<T>;

/**
 * Creates a lazy-loaded component with a loading fallback.
 *
 * @template T - The component type that extends ComponentType
 * @param importFn - Function that returns a promise resolving to the component module
 * @param fallback - Optional React node to display while loading (defaults to Spinner)
 * @returns A wrapper component that handles lazy loading with Suspense
 *
 * @example
 * ```tsx
 * const LazyDashboard = createLazyComponent(() => import('./Dashboard'));
 *
 * // Usage
 * <LazyDashboard userId="123" />
 * ```
 */
export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn) as LazyComponentType<T>;

  return function LazyWrapper(props: React.ComponentProps<T>) {
    // TypeScript limitation: LazyExoticComponent types don't properly propagate props
    // We use a double cast through 'unknown' to ComponentType, which is more explicit
    // than 'any' while acknowledging the type erasure needed for lazy components
    const Component = LazyComponent as unknown as ComponentType<Record<string, unknown>>;
    return (
      <Suspense fallback={fallback || <Spinner />}>
        <Component {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  };
}

/**
 * Lazy loads a component with a custom loading component.
 *
 * @template T - The component type that extends ComponentType
 * @param importFn - Function that returns a promise resolving to the component module
 * @param LoadingComponent - Optional component to display while loading (defaults to Spinner)
 * @returns A wrapper component that handles lazy loading with Suspense
 *
 * @example
 * ```tsx
 * const LazyProfile = lazyLoad(
 *   () => import('./Profile'),
 *   () => <CustomLoader />
 * );
 *
 * // Usage
 * <LazyProfile userId="123" />
 * ```
 */
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent?: ComponentType<Record<string, never>>
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn) as LazyComponentType<T>;

  return function LazyWrapper(props: React.ComponentProps<T>) {
    // TypeScript limitation: LazyExoticComponent types don't properly propagate props
    // We use a double cast through 'unknown' to ComponentType, which is more explicit
    // than 'any' while acknowledging the type erasure needed for lazy components
    const Component = LazyComponent as unknown as ComponentType<Record<string, unknown>>;
    const fallback = LoadingComponent ? <LoadingComponent /> : <Spinner />;
    return (
      <Suspense fallback={fallback}>
        <Component {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  };
}
