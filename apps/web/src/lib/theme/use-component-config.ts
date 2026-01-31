/**
 * Component Configuration Hook
 *
 * Provides utilities for accessing theme component configurations.
 * Supports component sizes, variants, and layout configurations.
 *
 * @example
 * ```tsx
 * import { useComponentConfig } from '@/lib/theme/use-component-config';
 *
 * function MyButton() {
 *   const { getSize, getVariant, getLayout } = useComponentConfig('button');
 *   const sizeConfig = getSize('md');
 *   const variantConfig = getVariant('primary');
 *
 *   return (
 *     <button style={{
 *       padding: `${sizeConfig?.paddingY} ${sizeConfig?.paddingX}`,
 *       backgroundColor: variantConfig?.background
 *     }}>
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 */

import { useGlobalTheme } from './global-theme-provider';
import type {
  ComponentSizeConfig,
  ComponentVariantConfig,
  ComponentLayoutConfig,
  ComponentConfig,
} from '@modele/types';

/**
 * Hook for accessing component configuration from theme
 *
 * @param componentName - Name of the component (e.g., 'button', 'card', 'input')
 * @returns Object with configuration access functions
 */
export function useComponentConfig(componentName: string) {
  const { theme } = useGlobalTheme();

  /**
   * Get size configuration for a component
   *
   * @param size - Size name (e.g., 'sm', 'md', 'lg')
   * @returns Size configuration or null if not found
   */
  const getSize = (size: string): ComponentSizeConfig | null => {
    if (!theme?.config?.components) {
      return null;
    }

    const componentConfig = theme.config.components[componentName as keyof ComponentConfig];
    if (!componentConfig || typeof componentConfig !== 'object') {
      return null;
    }

    const sizes = (componentConfig as { sizes?: Record<string, ComponentSizeConfig> }).sizes;
    if (!sizes || typeof sizes !== 'object') {
      return null;
    }

    const sizeConfig = sizes[size];
    return sizeConfig && typeof sizeConfig === 'object' ? sizeConfig : null;
  };

  /**
   * Get variant configuration for a component
   *
   * @param variant - Variant name (e.g., 'primary', 'secondary', 'outline')
   * @returns Variant configuration or null if not found
   */
  const getVariant = (variant: string): ComponentVariantConfig | null => {
    if (!theme?.config?.components) {
      return null;
    }

    const componentConfig = theme.config.components[componentName as keyof ComponentConfig];
    if (!componentConfig || typeof componentConfig !== 'object') {
      return null;
    }

    const variants = (componentConfig as { variants?: Record<string, ComponentVariantConfig> })
      .variants;
    if (!variants || typeof variants !== 'object') {
      return null;
    }

    const variantConfig = variants[variant];
    return variantConfig && typeof variantConfig === 'object' ? variantConfig : null;
  };

  /**
   * Get layout configuration for a component
   *
   * @returns Layout configuration or null if not found
   */
  const getLayout = (): ComponentLayoutConfig | null => {
    if (!theme?.config?.components) {
      return null;
    }

    const componentConfig = theme.config.components[componentName as keyof ComponentConfig];
    if (!componentConfig || typeof componentConfig !== 'object') {
      return null;
    }

    const layout = (componentConfig as { layout?: ComponentLayoutConfig }).layout;
    return layout && typeof layout === 'object' ? layout : null;
  };

  /**
   * Check if component has configuration
   *
   * @returns True if component has any configuration
   */
  const hasConfig = (): boolean => {
    return !!theme?.config?.components?.[componentName as keyof ComponentConfig];
  };

  return {
    getSize,
    getVariant,
    getLayout,
    hasConfig,
  };
}

/**
 * Standalone functions for use outside React components
 */
export const componentConfig = {
  /**
   * Get size configuration (standalone)
   */
  getSize: (
    componentName: string,
    size: string,
    theme?: { config?: { components?: ComponentConfig } }
  ): ComponentSizeConfig | null => {
    if (!theme?.config?.components) return null;
    const componentConfig = theme.config.components[componentName as keyof ComponentConfig];
    if (!componentConfig || typeof componentConfig !== 'object') return null;
    const sizes = (componentConfig as { sizes?: Record<string, ComponentSizeConfig> }).sizes;
    if (!sizes || typeof sizes !== 'object') return null;
    const sizeConfig = sizes[size];
    return sizeConfig && typeof sizeConfig === 'object' ? sizeConfig : null;
  },

  /**
   * Get variant configuration (standalone)
   */
  getVariant: (
    componentName: string,
    variant: string,
    theme?: { config?: { components?: ComponentConfig } }
  ): ComponentVariantConfig | null => {
    if (!theme?.config?.components) return null;
    const componentConfig = theme.config.components[componentName as keyof ComponentConfig];
    if (!componentConfig || typeof componentConfig !== 'object') return null;
    const variants = (componentConfig as { variants?: Record<string, ComponentVariantConfig> })
      .variants;
    if (!variants || typeof variants !== 'object') return null;
    const variantConfig = variants[variant];
    return variantConfig && typeof variantConfig === 'object' ? variantConfig : null;
  },

  /**
   * Get layout configuration (standalone)
   */
  getLayout: (
    componentName: string,
    theme?: { config?: { components?: ComponentConfig } }
  ): ComponentLayoutConfig | null => {
    if (!theme?.config?.components) return null;
    const componentConfig = theme.config.components[componentName as keyof ComponentConfig];
    if (!componentConfig || typeof componentConfig !== 'object') return null;
    const layout = (componentConfig as { layout?: ComponentLayoutConfig }).layout;
    return layout && typeof layout === 'object' ? layout : null;
  },
};
