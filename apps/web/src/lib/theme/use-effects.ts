/**
 * Effects Hook
 *
 * Provides utilities for accessing and applying theme effects.
 * Works with glassmorphism, shadows, gradients, and custom effects.
 *
 * @example
 * ```tsx
 * import { useEffects } from '@/lib/theme/use-effects';
 *
 * function MyCard() {
 *   const { getEffect, hasEffect } = useEffects();
 *
 *   if (hasEffect('glassmorphism')) {
 *     return (
 *       <div style={{
 *         backdropFilter: getEffect('glassmorphism', 'backdropBlur'),
 *         background: getEffect('glassmorphism', 'background')
 *       }}>
 *         Content
 *       </div>
 *     );
 *   }
 *
 *   return <div>Content</div>;
 * }
 * ```
 */

import type { CSSProperties } from 'react';
import { useGlobalTheme } from './global-theme-provider';

/**
 * Hook for accessing effects configuration from theme
 *
 * @returns Object with effects utility functions
 */
export function useEffects() {
  const { theme } = useGlobalTheme();

  /**
   * Get effect property value
   *
   * @param effectName - Effect name (e.g., 'glassmorphism', 'neon-glow')
   * @param property - Property name (e.g., 'backdropBlur', 'background')
   * @param fallback - Fallback value if not found
   * @returns CSS variable reference or fallback value
   */
  const getEffect = (effectName: string, property: string, fallback?: string): string => {
    if (typeof window === 'undefined') {
      return fallback || `var(--effect-${effectName}-${property})`;
    }

    const root = document.documentElement;
    // Convert camelCase to kebab-case for CSS variable
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    const variableName = `--effect-${effectName}-${cssProperty}`;
    const value = getComputedStyle(root).getPropertyValue(variableName).trim();

    return value || fallback || `var(${variableName})`;
  };

  /**
   * Check if effect is enabled in theme
   *
   * @param effectName - Effect name (e.g., 'glassmorphism', 'neon-glow')
   * @returns True if effect exists and is enabled
   */
  const hasEffect = (effectName: string): boolean => {
    if (!theme?.config?.effects) {
      return false;
    }

    const effects = theme.config.effects;
    const effect = effects[effectName];

    if (!effect) {
      return false;
    }

    // Check if effect is enabled (if it has an enabled property)
    if (typeof effect === 'object' && effect !== null && 'enabled' in effect) {
      return effect.enabled === true;
    }

    // If no enabled property, assume enabled if effect exists
    return true;
  };

  /**
   * Get glassmorphism card styles
   * Convenience method for common glassmorphism usage
   *
   * @returns Object with glassmorphism styles
   */
  const getGlassmorphismCardStyles = (): CSSProperties => {
    if (!hasEffect('glassmorphism')) {
      return {};
    }

    return {
      backgroundColor: getEffect(
        'glassmorphism',
        'cardBackground',
        'var(--glassmorphism-card-background)'
      ),
      backdropFilter: getEffect(
        'glassmorphism',
        'cardBackdropBlur',
        'var(--glassmorphism-card-backdrop-blur)'
      ),
      WebkitBackdropFilter: getEffect(
        'glassmorphism',
        'cardBackdropBlur',
        'var(--glassmorphism-card-backdrop-blur)'
      ),
      borderColor: getEffect('glassmorphism', 'cardBorder', 'var(--glassmorphism-card-border)'),
      boxShadow: getEffect('glassmorphism', 'shadow', 'var(--glassmorphism-shadow)'),
    };
  };

  /**
   * Get glassmorphism panel styles
   *
   * @returns Object with glassmorphism panel styles
   */
  const getGlassmorphismPanelStyles = (): CSSProperties => {
    if (!hasEffect('glassmorphism')) {
      return {};
    }

    return {
      backgroundColor: getEffect(
        'glassmorphism',
        'panelBackground',
        'var(--glassmorphism-panel-background)'
      ),
      backdropFilter: getEffect(
        'glassmorphism',
        'panelBackdropBlur',
        'var(--glassmorphism-panel-backdrop-blur)'
      ),
      WebkitBackdropFilter: getEffect(
        'glassmorphism',
        'panelBackdropBlur',
        'var(--glassmorphism-panel-backdrop-blur)'
      ),
      borderColor: getEffect('glassmorphism', 'panelBorder', 'var(--glassmorphism-panel-border)'),
    };
  };

  return {
    getEffect,
    hasEffect,
    getGlassmorphismCardStyles,
    getGlassmorphismPanelStyles,
  };
}

/**
 * Standalone functions for use outside React components
 */
export const effectsUtils = {
  /**
   * Get effect property (standalone)
   */
  getEffect: (effectName: string, property: string, fallback?: string): string => {
    if (typeof window === 'undefined') {
      return fallback || `var(--effect-${effectName}-${property})`;
    }
    const root = document.documentElement;
    const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
    const variableName = `--effect-${effectName}-${cssProperty}`;
    const value = getComputedStyle(root).getPropertyValue(variableName).trim();
    return value || fallback || `var(${variableName})`;
  },

  /**
   * Check if effect exists (standalone)
   */
  hasEffect: (
    effectName: string,
    theme?: { config?: { effects?: Record<string, unknown> } }
  ): boolean => {
    if (!theme?.config?.effects) return false;
    const effects = theme.config.effects;
    const effect = effects[effectName];
    if (!effect) return false;
    if (typeof effect === 'object' && effect !== null && 'enabled' in effect) {
      return effect.enabled === true;
    }
    return true;
  },
};
