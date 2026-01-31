/**
 * Theme Spacing Hook
 *
 * Provides utilities for accessing theme spacing values.
 * Works with both old spacing format and new layout.spacing format.
 *
 * @example
 * ```tsx
 * import { useThemeSpacing } from '@/lib/theme/use-theme-spacing';
 *
 * function MyComponent() {
 *   const { getSpacing, getGap, getContainerWidth } = useThemeSpacing();
 *
 *   return (
 *     <div style={{ padding: getSpacing('md') }}>
 *       <div style={{ gap: getGap('normal') }}>
 *         Content
 *       </div>
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Get spacing value from theme
 *
 * @param key - Spacing key (xs, sm, md, lg, xl, 2xl, 3xl)
 * @param fallback - Fallback value if not found
 * @returns CSS variable reference or fallback value
 */
function getSpacingValue(key: string, fallback?: string): string {
  if (typeof window === 'undefined') {
    // SSR: return CSS variable reference
    return fallback || `var(--spacing-${key})`;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--spacing-${key}`).trim();

  return value || fallback || `var(--spacing-${key})`;
}

/**
 * Get gap value from theme
 *
 * @param size - Gap size (tight, normal, loose)
 * @param fallback - Fallback value if not found
 * @returns CSS variable reference or fallback value
 */
function getGapValue(size: 'tight' | 'normal' | 'loose' = 'normal', fallback?: string): string {
  if (typeof window === 'undefined') {
    return fallback || `var(--gap-${size}, 1rem)`;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--gap-${size}`).trim();

  return value || fallback || `var(--gap-${size}, 1rem)`;
}

/**
 * Get container width from theme
 *
 * @param size - Container size (sm, md, lg, xl)
 * @param fallback - Fallback value if not found
 * @returns CSS variable reference or fallback value
 */
function getContainerWidthValue(size: 'sm' | 'md' | 'lg' | 'xl' = 'lg', fallback?: string): string {
  if (typeof window === 'undefined') {
    return fallback || `var(--container-${size}, 1024px)`;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(`--container-${size}`).trim();

  return value || fallback || `var(--container-${size}, 1024px)`;
}

/**
 * Hook for accessing theme spacing values
 *
 * @returns Object with spacing utility functions
 */
export function useThemeSpacing() {
  /**
   * Get spacing value
   */
  const getSpacing = (key: string, fallback?: string): string => {
    return getSpacingValue(key, fallback);
  };

  /**
   * Get gap value
   */
  const getGap = (size: 'tight' | 'normal' | 'loose' = 'normal', fallback?: string): string => {
    return getGapValue(size, fallback);
  };

  /**
   * Get container width
   */
  const getContainerWidth = (size: 'sm' | 'md' | 'lg' | 'xl' = 'lg', fallback?: string): string => {
    return getContainerWidthValue(size, fallback);
  };

  /**
   * Get spacing unit (base unit for calculations)
   */
  const getSpacingUnit = (fallback: string = '0.5rem'): string => {
    return getSpacingValue('unit', fallback);
  };

  /**
   * Get spacing scale multiplier
   */
  const getSpacingScale = (fallback: number = 1.5): number => {
    if (typeof window === 'undefined') {
      return fallback;
    }

    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue('--spacing-scale').trim();

    return value ? parseFloat(value) || fallback : fallback;
  };

  return {
    getSpacing,
    getGap,
    getContainerWidth,
    getSpacingUnit,
    getSpacingScale,
  };
}

/**
 * Standalone functions for use outside React components
 */
export const themeSpacing = {
  getSpacing: getSpacingValue,
  getGap: getGapValue,
  getContainerWidth: getContainerWidthValue,
  getSpacingUnit: () => getSpacingValue('unit', '0.5rem'),
  getSpacingScale: () => {
    if (typeof window === 'undefined') return 1.5;
    const root = document.documentElement;
    const value = getComputedStyle(root).getPropertyValue('--spacing-scale').trim();
    return value ? parseFloat(value) || 1.5 : 1.5;
  },
};
