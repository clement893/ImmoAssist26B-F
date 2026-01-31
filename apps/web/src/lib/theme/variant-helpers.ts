/**
 * Variant Helper Functions
 *
 * Utilities for applying component variant configurations from themes.
 * Converts variant config objects into CSS classes and styles.
 *
 * @example
 * ```tsx
 * import { applyVariantConfig } from '@/lib/theme/variant-helpers';
 *
 * const variantConfig = {
 *   background: '#3b82f6',
 *   text: 'white',
 *   hover: '#2563eb'
 * };
 *
 * const classes = applyVariantConfig(['base-class'], variantConfig);
 * // Returns: 'base-class [background-color:#3b82f6] [color:white] hover:[background-color:#2563eb]'
 * ```
 */

import type { ComponentVariantConfig } from '@modele/types';

/**
 * Apply variant configuration to base classes
 * Converts variant config properties to Tailwind arbitrary values
 *
 * @param baseClasses - Array of base CSS classes
 * @param variantConfig - Variant configuration object
 * @returns Combined class string with variant styles
 */
export function applyVariantConfig(
  baseClasses: string[],
  variantConfig: ComponentVariantConfig
): string {
  const classes = [...baseClasses];

  // Convert config properties to Tailwind arbitrary values
  if (variantConfig.background) {
    classes.push(`[background-color:${variantConfig.background}]`);
  }

  if (variantConfig.text) {
    classes.push(`[color:${variantConfig.text}]`);
  }

  if (variantConfig.border) {
    classes.push(`[border-color:${variantConfig.border}]`);
  }

  if (variantConfig.borderRadius) {
    classes.push(`[border-radius:${variantConfig.borderRadius}]`);
  }

  if (variantConfig.boxShadow) {
    classes.push(`[box-shadow:${variantConfig.boxShadow}]`);
  }

  if (variantConfig.textShadow) {
    classes.push(`[text-shadow:${variantConfig.textShadow}]`);
  }

  // Handle hover state
  if (variantConfig.hover) {
    classes.push(`hover:[background-color:${variantConfig.hover}]`);
  }

  // Handle any additional properties
  Object.entries(variantConfig).forEach(([key, value]) => {
    if (
      ![
        'background',
        'text',
        'border',
        'borderRadius',
        'boxShadow',
        'textShadow',
        'hover',
      ].includes(key)
    ) {
      if (typeof value === 'string') {
        // Convert camelCase to kebab-case for CSS properties
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        classes.push(`[${cssProperty}:${value}]`);
      }
    }
  });

  return classes.filter(Boolean).join(' ');
}

/**
 * Apply variant configuration as inline styles
 * Useful when CSS variables or complex values are needed
 *
 * @param variantConfig - Variant configuration object
 * @returns React CSS properties object
 */
export function applyVariantConfigAsStyles(
  variantConfig: ComponentVariantConfig
): React.CSSProperties {
  const styles: React.CSSProperties = {};

  if (variantConfig.background) {
    styles.backgroundColor = variantConfig.background;
  }

  if (variantConfig.text) {
    styles.color = variantConfig.text;
  }

  if (variantConfig.border) {
    styles.borderColor = variantConfig.border;
  }

  if (variantConfig.borderRadius) {
    styles.borderRadius = variantConfig.borderRadius;
  }

  if (variantConfig.boxShadow) {
    styles.boxShadow = variantConfig.boxShadow;
  }

  if (variantConfig.textShadow) {
    styles.textShadow = variantConfig.textShadow;
  }

  // Handle any additional properties
  Object.entries(variantConfig).forEach(([key, value]) => {
    if (
      ![
        'background',
        'text',
        'border',
        'borderRadius',
        'boxShadow',
        'textShadow',
        'hover',
      ].includes(key)
    ) {
      if (typeof value === 'string') {
        // Convert camelCase to kebab-case for CSS properties
        const cssProperty = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        // Use Record<string, string> for dynamic CSS properties to allow string values
        (styles as unknown as Record<string, string>)[cssProperty] = value;
      }
    }
  });

  return styles;
}

/**
 * Merge variant config with default variant
 * Theme config overrides defaults
 *
 * @param defaultVariant - Default variant classes
 * @param variantConfig - Theme variant configuration
 * @returns Merged class string
 */
export function mergeVariantConfig(
  defaultVariant: string,
  variantConfig?: ComponentVariantConfig | null
): string {
  if (!variantConfig) {
    return defaultVariant;
  }

  const defaultClasses = defaultVariant.split(' ').filter(Boolean);
  return applyVariantConfig(defaultClasses, variantConfig);
}

/**
 * Get hover classes from variant config
 *
 * @param variantConfig - Variant configuration object
 * @returns Hover classes string
 */
export function getVariantHoverClasses(variantConfig: ComponentVariantConfig): string {
  const classes: string[] = [];

  if (variantConfig.hover) {
    classes.push(`hover:[background-color:${variantConfig.hover}]`);
  }

  return classes.join(' ');
}
