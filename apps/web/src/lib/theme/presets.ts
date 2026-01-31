/**
 * Theme Presets
 * Pre-configured theme templates for quick setup
 */

import type { ThemeConfig } from '@modele/types';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  config: ThemeConfig;
}

/**
 * Minimal Theme Preset
 * Clean, spacious design with subtle colors
 */
export const minimalPreset: ThemePreset = {
  id: 'minimal',
  name: 'Modern Minimal',
  description: 'Clean, spacious design with subtle colors and generous whitespace',
  config: {
    primary_color: '#1f2937',
    secondary_color: '#6b7280',
    danger_color: '#dc2626',
    warning_color: '#d97706',
    info_color: '#0891b2',
    success_color: '#059669',
    font_family: 'system-ui, -apple-system, sans-serif',
    border_radius: '0.375rem',
    mode: 'system',
    layout: {
      spacing: {
        unit: '0.25rem',
        scale: 1.5,
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
      gaps: {
        tight: '0.5rem',
        normal: '1rem',
        loose: '2rem',
      },
      containers: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
    typography: {
      fontFamily: {
        sans: 'system-ui, -apple-system, sans-serif',
        serif: 'Georgia, serif',
        mono: 'Menlo, monospace',
      } as unknown as string,
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
};

/**
 * Bold Theme Preset
 * High contrast, vibrant colors
 */
export const boldPreset: ThemePreset = {
  id: 'bold',
  name: 'Bold',
  description: 'High contrast design with vibrant colors and strong typography',
  config: {
    primary_color: '#7c3aed',
    secondary_color: '#ec4899',
    danger_color: '#dc2626',
    warning_color: '#f59e0b',
    info_color: '#3b82f6',
    success_color: '#10b981',
    font_family: 'Inter, sans-serif',
    border_radius: '0.5rem',
    mode: 'system',
    layout: {
      spacing: {
        unit: '0.25rem',
        scale: 1.25,
        xs: '0.5rem',
        sm: '0.75rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
      },
    },
    typography: {
      fontWeight: {
        normal: '400',
        medium: '600',
        semibold: '700',
        bold: '800',
      },
    },
  },
};

/**
 * Neon Theme Preset
 * Cyberpunk-inspired with neon colors and glow effects
 */
export const neonPreset: ThemePreset = {
  id: 'neon',
  name: 'Neon Cyberpunk',
  description: 'Futuristic design with neon colors and glowing effects',
  config: {
    primary_color: '#06b6d4',
    secondary_color: '#a855f7',
    danger_color: '#ef4444',
    warning_color: '#fbbf24',
    info_color: '#3b82f6',
    success_color: '#10b981',
    font_family: 'JetBrains Mono, monospace',
    border_radius: '0.25rem',
    mode: 'dark',
    effects: {
      glassmorphism: {
        enabled: true,
        card: {
          background: 'rgba(6, 182, 212, 0.1)',
          backdropBlur: '10px',
          border: '1px solid rgba(6, 182, 212, 0.3)',
        },
        panel: {
          background: 'rgba(168, 85, 247, 0.1)',
          backdropBlur: '12px',
          border: '1px solid rgba(168, 85, 247, 0.3)',
        },
      },
    },
    layout: {
      spacing: {
        unit: '0.25rem',
        scale: 1.5,
      },
    },
  },
};

/**
 * Corporate Theme Preset
 * Professional business aesthetic
 */
export const corporatePreset: ThemePreset = {
  id: 'corporate',
  name: 'Corporate Professional',
  description: 'Traditional business design with conservative colors and structured layouts',
  config: {
    primary_color: '#1e40af',
    secondary_color: '#475569',
    danger_color: '#dc2626',
    warning_color: '#d97706',
    info_color: '#0284c7',
    success_color: '#059669',
    font_family: 'Roboto, sans-serif',
    border_radius: '0.25rem',
    mode: 'system',
    layout: {
      spacing: {
        unit: '0.25rem',
        scale: 1.25,
      },
      containers: {
        sm: '600px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
      },
    },
    typography: {
      fontFamily: {
        sans: 'Roboto, sans-serif',
      } as unknown as string,
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
};

/**
 * Modern Theme Preset
 * Contemporary design with balanced colors
 */
export const modernPreset: ThemePreset = {
  id: 'modern',
  name: 'Modern',
  description: 'Contemporary design with balanced colors and smooth transitions',
  config: {
    primary_color: '#3b82f6',
    secondary_color: '#8b5cf6',
    danger_color: '#ef4444',
    warning_color: '#f59e0b',
    info_color: '#06b6d4',
    success_color: '#10b981',
    font_family: 'Inter, sans-serif',
    border_radius: '0.5rem',
    mode: 'system',
    animations: {
      duration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    layout: {
      spacing: {
        unit: '0.25rem',
        scale: 1.5,
      },
    },
  },
};

/**
 * All available presets
 */
export const themePresets: ThemePreset[] = [
  minimalPreset,
  boldPreset,
  neonPreset,
  corporatePreset,
  modernPreset,
];

/**
 * Get preset by ID
 */
export function getPresetById(id: string): ThemePreset | undefined {
  return themePresets.find((preset) => preset.id === id);
}

/**
 * Export preset config as JSON string
 */
export function exportPresetAsJSON(preset: ThemePreset): string {
  return JSON.stringify(preset.config, null, 2);
}

/**
 * Import preset from JSON string
 */
export function importPresetFromJSON(json: string): ThemeConfig | null {
  try {
    return JSON.parse(json) as ThemeConfig;
  } catch (error: unknown) {
    // Use logger if available, otherwise silent fail (utility function may be called before logger is initialized)
    if (
      typeof window !== 'undefined' &&
      typeof process !== 'undefined' &&
      process.env?.NODE_ENV === 'development'
    ) {
      try {
        // Dynamic import to avoid circular dependencies
        import('@/lib/logger')
          .then(({ logger }) => {
            logger.error('Failed to parse preset JSON', error);
          })
          .catch(() => {
            // Logger not available, fail silently
          });
      } catch {
        // Logger not available, fail silently
      }
    }
    return null;
  }
}
