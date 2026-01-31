/**
 * Layout Hook
 *
 * Provides utilities for accessing theme layout configurations.
 * Works with gaps, containers, and spacing from theme layout config.
 *
 * @example
 * ```tsx
 * import { useLayout } from '@/lib/theme/use-layout';
 *
 * function MyComponent() {
 *   const { getGap, getContainerWidth } = useLayout();
 *
 *   return (
 *     <div style={{ gap: getGap('normal'), maxWidth: getContainerWidth('lg') }}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */

import { useGlobalTheme } from './global-theme-provider';

/**
 * Hook for accessing layout configuration from theme
 *
 * @returns Object with layout utility functions
 */
export function useLayout() {
  const { theme } = useGlobalTheme();

  // Handle case where theme might be null (provider not available)
  // This allows Container and other components to work during SSR or outside main layout

  /**
   * Get gap value from theme
   *
   * @param size - Gap size (tight, normal, loose)
   * @param fallback - Fallback value if not found
   * @returns CSS variable reference or fallback value
   */
  const getGap = (size: 'tight' | 'normal' | 'loose' = 'normal', fallback?: string): string => {
    if (typeof window === 'undefined') {
      return fallback || `var(--gap-${size}, 1rem)`;
    }

    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(`--gap-${size}`).trim();

    return value || fallback || `var(--gap-${size}, 1rem)`;
  };

  /**
   * Get container width from theme
   *
   * @param size - Container size (sm, md, lg, xl)
   * @param fallback - Fallback value if not found
   * @returns CSS variable reference or fallback value
   */
  const getContainerWidth = (size: 'sm' | 'md' | 'lg' | 'xl' = 'lg', fallback?: string): string => {
    if (typeof window === 'undefined') {
      return fallback || `var(--container-${size}, 1024px)`;
    }

    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(`--container-${size}`).trim();

    return value || fallback || `var(--container-${size}, 1024px)`;
  };

  /**
   * Check if layout config exists in theme
   *
   * @returns True if layout config exists
   */
  const hasLayoutConfig = (): boolean => {
    return !!theme?.config?.layout;
  };

  return {
    getGap,
    getContainerWidth,
    hasLayoutConfig,
  };
}

/**
 * Standalone functions for use outside React components
 */
export const layoutUtils = {
  /**
   * Get gap value (standalone)
   */
  getGap: (size: 'tight' | 'normal' | 'loose' = 'normal', fallback: string = '1rem'): string => {
    if (typeof window === 'undefined') {
      return `var(--gap-${size}, ${fallback})`;
    }
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(`--gap-${size}`).trim();
    return value || `var(--gap-${size}, ${fallback})`;
  },

  /**
   * Get container width (standalone)
   */
  getContainerWidth: (
    size: 'sm' | 'md' | 'lg' | 'xl' = 'lg',
    fallback: string = '1024px'
  ): string => {
    if (typeof window === 'undefined') {
      return `var(--container-${size}, ${fallback})`;
    }
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue(`--container-${size}`).trim();
    return value || `var(--container-${size}, ${fallback})`;
  },
};
