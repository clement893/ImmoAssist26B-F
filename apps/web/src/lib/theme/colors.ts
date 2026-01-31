/**
 * Theme Colors Helper
 * Provides access to theme colors via CSS variables
 * All colors adapt automatically to light/dark mode
 */

/**
 * Get a CSS variable color value
 * Works in both client and server environments
 * For SSR, returns the fallback or CSS variable reference
 */
export function getThemeColor(variableName: string, fallback?: string): string {
  if (typeof window === 'undefined') {
    // In SSR, return CSS variable reference or fallback
    return fallback ? `var(${variableName}, ${fallback})` : `var(${variableName})`;
  }

  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(variableName);
  const trimmed = value.trim();

  // If we got a value, return it; otherwise use fallback or CSS variable
  if (trimmed) {
    return trimmed;
  }

  // Return CSS variable reference so it works in styles
  return fallback ? `var(${variableName}, ${fallback})` : `var(${variableName})`;
}

/**
 * Theme color variables - Status colors
 * Returns CSS variable references that adapt to light/dark mode
 */
export const statusColors = {
  todo: () => 'var(--color-status-todo)',
  inProgress: () => 'var(--color-status-in-progress)',
  done: () => 'var(--color-status-done)',
  error: () => 'var(--color-status-error)',
};

/**
 * Theme color variables - Chart colors
 * Returns CSS variable references that adapt to light/dark mode
 */
export const chartColors = {
  default: () => 'var(--color-chart-default)',
  success: () => 'var(--color-chart-success)',
  warning: () => 'var(--color-chart-warning)',
  danger: () => 'var(--color-chart-danger)',
};

/**
 * Theme color variables - Primary colors
 * Returns CSS variable references that adapt to light/dark mode
 */
export const primaryColors = {
  50: () => 'var(--color-primary-50)',
  100: () => 'var(--color-primary-100)',
  200: () => 'var(--color-primary-200)',
  300: () => 'var(--color-primary-300)',
  400: () => 'var(--color-primary-400)',
  500: () => 'var(--color-primary-500)',
  600: () => 'var(--color-primary-600)',
  700: () => 'var(--color-primary-700)',
  800: () => 'var(--color-primary-800)',
  900: () => 'var(--color-primary-900)',
};

/**
 * Theme color variables - Secondary colors
 * Returns CSS variable references that adapt to light/dark mode
 */
export const secondaryColors = {
  500: () => 'var(--color-secondary-500)',
};

/**
 * Theme color variables - Danger colors
 * Returns CSS variable references that adapt to light/dark mode
 */
export const dangerColors = {
  500: () => 'var(--color-danger-500)',
};

/**
 * Theme color variables - Warning colors
 * Returns CSS variable references that adapt to light/dark mode
 */
export const warningColors = {
  500: () => 'var(--color-warning-500)',
};

/**
 * Helper to get color by status
 */
export function getStatusColor(status: 'todo' | 'in-progress' | 'done' | 'error'): string {
  switch (status) {
    case 'todo':
      return statusColors.todo();
    case 'in-progress':
      return statusColors.inProgress();
    case 'done':
      return statusColors.done();
    case 'error':
      return statusColors.error();
    default:
      return statusColors.todo();
  }
}

/**
 * Helper to get chart color by metric status
 */
export function getChartColorByStatus(
  value: number,
  threshold?: { warning?: number; critical?: number }
): string {
  if (!threshold) {
    return chartColors.default();
  }

  const { warning, critical } = threshold;

  if (critical && value >= critical) {
    return chartColors.danger();
  } else if (warning && value >= warning) {
    return chartColors.warning();
  }

  return chartColors.success();
}

/**
 * Get a color for a chart data series by index
 * Uses theme colors in a rotating pattern
 */
export function getChartColorByIndex(index: number): string {
  const colors = [
    chartColors.default(),
    chartColors.success(),
    chartColors.warning(),
    chartColors.danger(),
    'var(--color-primary-500)',
    'var(--color-secondary-500)',
    'var(--color-info-500)',
    'var(--color-primary-400)',
    'var(--color-secondary-400)',
    'var(--color-primary-600)',
    'var(--color-secondary-600)',
  ];

  return colors[index % colors.length] || colors[0] || 'var(--color-primary-500)';
}
