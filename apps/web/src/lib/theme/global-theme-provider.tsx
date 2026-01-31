/**
 * Global Theme Provider - Fetches and applies the active theme from the backend.
 */
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  ReactNode,
  startTransition,
} from 'react';
import { getActiveTheme } from '@/lib/api/theme';
import { logger } from '@/lib/logger';
import type {
  ThemeConfigResponse,
  ThemeConfig,
  ThemeConfigAccessor,
  TypographyConfig,
} from '@modele/types';
import { generateColorShades, generateRgb } from './color-utils';
import { getThemeConfigForMode } from './dark-mode-utils';
import { getThemeFromCache, saveThemeToCache, clearThemeCache } from './theme-cache';
import { checkFonts } from '@/lib/api/theme-font';
import { TokenStorage } from '@/lib/auth/tokenStorage';

interface GlobalThemeContextType {
  theme: ThemeConfigResponse | null;
  isLoading: boolean;
  error: Error | null;
  refreshTheme: () => Promise<void>;
}

const GlobalThemeContext = createContext<GlobalThemeContextType | undefined>(undefined);

interface GlobalThemeProviderProps {
  children: ReactNode;
}

export function GlobalThemeProvider({ children }: GlobalThemeProviderProps) {
  // Preload theme from cache synchronously to avoid re-renders
  const cachedTheme = typeof window !== 'undefined' ? getThemeFromCache() : null;
  const initialTheme = cachedTheme
    ? ({
        config: cachedTheme,
      } as ThemeConfigResponse)
    : null;

  const [theme, setTheme] = useState<ThemeConfigResponse | null>(initialTheme);
  const [error, setError] = useState<Error | null>(null);

  const fetchTheme = async (forceApply: boolean = false) => {
    try {
      setError(null);

      // If forceApply, clear cache FIRST to ensure we don't use stale data
      if (forceApply) {
        clearThemeCache();
        // Wait a bit for backend to commit the change (database transaction)
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const activeTheme = await getActiveTheme();

      // Check if theme changed (ID or config)
      const currentThemeId = theme?.id;
      const themeIdChanged = currentThemeId !== activeTheme.id;

      // Compare config to detect changes even if ID is the same
      // Use a more robust comparison that handles object order differences
      const currentConfigStr = theme?.config
        ? JSON.stringify(theme.config, Object.keys(theme.config).sort())
        : null;
      const newConfigStr = activeTheme.config
        ? JSON.stringify(activeTheme.config, Object.keys(activeTheme.config).sort())
        : null;
      const configChanged = themeIdChanged || currentConfigStr !== newConfigStr;

      // Always apply if forced, or if theme/config changed, or if no theme is set yet
      // When forceApply is true, ALWAYS apply immediately, ignoring cache
      if (forceApply || configChanged || !theme) {
        logger.info('[Theme] Theme changed or force apply, applying new configuration', {
          oldId: currentThemeId,
          newId: activeTheme.id,
          idChanged: themeIdChanged,
          configChanged: !themeIdChanged && configChanged,
          forceApply,
          hasTheme: !!theme,
        });

        // Update state first
        setTheme(activeTheme);

        // Apply theme config from backend IMMEDIATELY (synchronously)
        // Don't override if manual theme is active (for preview mode)
        const isManualTheme =
          typeof document !== 'undefined' &&
          document.documentElement.hasAttribute('data-manual-theme');
        if (!isManualTheme) {
          // Apply immediately and synchronously - this happens BEFORE React re-render
          applyThemeConfig(activeTheme.config);
          logger.info('[Theme] Theme config applied to DOM immediately', {
            themeId: activeTheme.id,
          });

          // Force multiple reflows to ensure styles are applied and visible immediately
          if (typeof document !== 'undefined') {
            // Trigger reflow multiple times to ensure browser applies styles
            document.documentElement.offsetHeight; // First reflow
            requestAnimationFrame(() => {
              document.documentElement.offsetHeight; // Second reflow in next frame
            });
          }
        } else {
          logger.info('[Theme] Skipped theme application (manual theme active)');
        }

        // Cache the theme AFTER application for next time
        saveThemeToCache(activeTheme.config, activeTheme.id);
      } else {
        logger.debug('[Theme] Theme unchanged, skipping application', {
          currentId: currentThemeId,
          activeId: activeTheme.id,
        });
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Failed to load theme');
      setError(error);
      logger.error('Failed to fetch global theme from backend', {
        message: error.message,
        name: error.name,
      });

      // If we have a cached theme, use it as fallback
      const fallbackCachedTheme = getThemeFromCache();
      if (fallbackCachedTheme && !theme) {
        const cachedThemeResponse: ThemeConfigResponse = {
          config: fallbackCachedTheme,
        } as ThemeConfigResponse;
        setTheme(cachedThemeResponse);
        // Don't override if manual theme is active
        const isManualTheme =
          typeof document !== 'undefined' &&
          document.documentElement.hasAttribute('data-manual-theme');
        if (!isManualTheme) {
          applyThemeConfig(fallbackCachedTheme);
          logger.info('[Theme] Using cached theme as fallback');
        }
      }
      // Otherwise, the application will continue without theme customization
    }
  };

  const applyThemeConfig = (config: ThemeConfig) => {
    // Check actual dark class on document root (set by ThemeContext)
    // This ensures we use the correct mode even if theme config mode doesn't match
    const root = document.documentElement;
    const isDarkMode = root.classList.contains('dark');

    // Get theme config for current mode (light/dark/system)
    // But override mode based on actual dark class if present
    const actualMode = isDarkMode ? 'dark' : 'light';
    const configWithActualMode = { ...config, mode: actualMode } as ThemeConfig;
    const modeConfig = getThemeConfigForMode(configWithActualMode);

    // Note: We do NOT manage light/dark classes here - that's ThemeProvider's responsibility
    // ThemeProvider is the single source of truth for light/dark mode classes
    // We only manage CSS variables (colors, fonts, effects, etc.)

    // Apply CSS variables to document root
    // Use mode-specific config
    const configToApply = modeConfig;

    // Support multiple formats:
    // 1. Flat format: primary_color, secondary_color, etc.
    // 2. Short format: primary, secondary, etc. (directly in config)
    // 3. Nested format: colors.primary, colors.secondary, etc.
    const configAccessor = configToApply as ThemeConfigAccessor;
    const colorsConfig = configAccessor.colors || {};
    const primaryColor =
      configAccessor.primary ||
      configToApply.primary_color ||
      colorsConfig.primary_color ||
      colorsConfig.primary;
    const secondaryColor =
      configAccessor.secondary ||
      configToApply.secondary_color ||
      colorsConfig.secondary_color ||
      colorsConfig.secondary;
    const dangerColor =
      configAccessor.danger ||
      configToApply.danger_color ||
      colorsConfig.danger_color ||
      colorsConfig.destructive ||
      colorsConfig.danger;
    const warningColor =
      configAccessor.warning ||
      configToApply.warning_color ||
      colorsConfig.warning_color ||
      colorsConfig.warning;
    const infoColor =
      configAccessor.info ||
      configToApply.info_color ||
      colorsConfig.info_color ||
      colorsConfig.info;
    const successColor =
      configAccessor.success ||
      configToApply.success_color ||
      colorsConfig.success_color ||
      colorsConfig.success;

    // Generate color shades from base colors
    if (primaryColor) {
      const primaryShades = generateColorShades(primaryColor);
      Object.entries(primaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-primary-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-primary-rgb`, generateRgb(color));
        }
      });
    }

    if (secondaryColor) {
      const secondaryShades = generateColorShades(secondaryColor);
      Object.entries(secondaryShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-secondary-${shade}`, color);
        // Also set success colors as aliases to secondary (unless success_color is explicitly set)
        if (!successColor) {
          root.style.setProperty(`--color-success-${shade}`, color);
        }
        if (shade === '500') {
          root.style.setProperty(`--color-secondary-rgb`, generateRgb(color));
          if (!successColor) {
            root.style.setProperty(`--color-success-rgb`, generateRgb(color));
          }
        }
      });
    }

    if (dangerColor) {
      const dangerShades = generateColorShades(dangerColor);
      Object.entries(dangerShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-danger-${shade}`, color);
        // Also set error colors as aliases to danger
        root.style.setProperty(`--color-error-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-danger-rgb`, generateRgb(color));
          root.style.setProperty(`--color-error-rgb`, generateRgb(color));
        }
      });
    }

    if (warningColor) {
      const warningShades = generateColorShades(warningColor);
      Object.entries(warningShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-warning-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-warning-rgb`, generateRgb(color));
        }
      });
    }

    if (infoColor) {
      const infoShades = generateColorShades(infoColor);
      Object.entries(infoShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-info-${shade}`, color);
      });
    }

    if (successColor) {
      // Success colors can be explicitly set, overriding secondary defaults
      const successShades = generateColorShades(successColor);
      Object.entries(successShades).forEach(([shade, color]) => {
        root.style.setProperty(`--color-success-${shade}`, color);
        if (shade === '500') {
          root.style.setProperty(`--color-success-rgb`, generateRgb(color));
        }
      });
    }

    // Also apply colors from nested colors object if available
    // Note: We only set CSS variables, not body styles directly, to prevent hydration mismatches
    // Body styles are handled via CSS in layout.tsx using these CSS variables
    if (colorsConfig.background && typeof colorsConfig.background === 'string') {
      root.style.setProperty('--color-background', colorsConfig.background);
    }
    if (colorsConfig.foreground && typeof colorsConfig.foreground === 'string') {
      root.style.setProperty('--color-foreground', colorsConfig.foreground);
    }
    if (colorsConfig.muted) {
      root.style.setProperty('--color-muted', colorsConfig.muted);
    }
    if (colorsConfig.mutedForeground) {
      root.style.setProperty('--color-muted-foreground', colorsConfig.mutedForeground);
    }
    if (colorsConfig.border) {
      root.style.setProperty('--color-border', colorsConfig.border);
    }
    if (colorsConfig.input) {
      root.style.setProperty('--color-input', colorsConfig.input);
    }
    if (colorsConfig.ring) {
      root.style.setProperty('--color-ring', colorsConfig.ring);
    }

    // Load font URL if configured (for Google Fonts or custom fonts)
    if (
      configToApply.font_url &&
      typeof configToApply.font_url === 'string' &&
      typeof document !== 'undefined'
    ) {
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[data-theme-font]`);
      if (existingLink) {
        existingLink.remove();
      }

      // Load font dynamically
      const fontUrl =
        typeof config.font_url === 'string' ? config.font_url : String(config.font_url || '');
      if (fontUrl) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = fontUrl;
        link.setAttribute('data-theme-font', 'true');
        document.head.appendChild(link);
      }
    }

    // Apply fonts - Only set CSS variables, don't modify body/html directly to avoid hydration issues
    if (configToApply.font_family) {
      const fontFamily = configToApply.font_family.trim();
      root.style.setProperty('--font-family', `${fontFamily}, sans-serif`);
      root.style.setProperty('--font-family-heading', `${fontFamily}, sans-serif`);
      root.style.setProperty('--font-family-subheading', `${fontFamily}, sans-serif`);
      // Don't modify document.body or root directly - let CSS handle it via var(--font-family)
    }

    // Also check typography.fontUrl for new format
    const typography = configToApply.typography as TypographyConfig | undefined;
    if (typography?.fontUrl && typeof document !== 'undefined') {
      const fontUrl = typography.fontUrl;
      const existingLink = document.querySelector(`link[data-theme-font]`);
      if (existingLink) {
        existingLink.remove();
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      link.setAttribute('data-theme-font', 'true');
      document.head.appendChild(link);
    }

    // Apply fonts from typography config if available
    if (typography?.fontFamily) {
      const fontFamily = String(typography.fontFamily).trim();
      root.style.setProperty('--font-family', fontFamily);
      if (typography.fontFamilyHeading) {
        root.style.setProperty('--font-family-heading', String(typography.fontFamilyHeading));
      }
      if (typography.fontFamilySubheading) {
        root.style.setProperty('--font-family-subheading', String(typography.fontFamilySubheading));
      }
      // Don't modify document.body or root directly - let CSS handle it via var(--font-family)

      // Check if fonts exist in database and warn user if not
      if (typeof window !== 'undefined') {
        const fontsToCheck: string[] = [];
        if (typography?.fontFamily) {
          fontsToCheck.push(String(typography.fontFamily));
        }
        if (typography?.fontFamilyHeading) {
          fontsToCheck.push(String(typography.fontFamilyHeading));
        }
        if (typography?.fontFamilySubheading) {
          fontsToCheck.push(String(typography.fontFamilySubheading));
        }

        // Extract font names from CSS font-family strings (e.g., "Inter, sans-serif" -> "Inter")
        const extractFontName = (fontFamily: string): string => {
          const cleaned = fontFamily.replace(/['"]/g, '').trim();
          const parts = cleaned.split(',');
          return parts[0]?.trim() || cleaned;
        };

        // List of common Google Fonts that don't need to be checked in database
        const GOOGLE_FONTS = [
          'Inter',
          'Roboto',
          'Open Sans',
          'Lato',
          'Montserrat',
          'Poppins',
          'Source Sans Pro',
          'Raleway',
          'Oswald',
          'Ubuntu',
          'Playfair Display',
          'Merriweather',
          'PT Sans',
          'Nunito',
          'Crimson Text',
          'Lora',
        ];

        const fontNames = fontsToCheck
          .map(extractFontName)
          .filter(Boolean)
          .filter((name) => !GOOGLE_FONTS.includes(name)); // Skip Google Fonts

        // Only check fonts if user is authenticated (font check API requires auth)
        // Skip check for Google Fonts as they're loaded via next/font/google
        if (fontNames.length > 0 && typeof window !== 'undefined') {
          // Check if user is authenticated before making API call
          const token = TokenStorage.getToken();

          if (token) {
            checkFonts(fontNames)
              .then((fontCheckResult: Record<string, boolean>) => {
                const missingFonts = Object.entries(fontCheckResult)
                  .filter(([_, exists]) => !exists)
                  .map(([name]) => name);

                if (missingFonts.length > 0) {
                  logger.warn(
                    `[Theme] Fonts not found in database: ${missingFonts.join(', ')}. ` +
                      `Please upload these fonts to ensure they are available.`
                  );
                  // Theme warnings are non-critical, use logger for consistent logging
                  if (typeof window !== 'undefined' && missingFonts.length > 0) {
                    logger.warn(
                      `Theme Font Warning: The following fonts are not in the database: ${missingFonts.join(', ')}. Please upload them via the theme fonts management page to ensure proper display.`,
                      { missingFonts }
                    );
                  }
                }
              })
              .catch((error: unknown) => {
                // Don't block theme application if font check fails
                // Only log authentication errors in development to avoid noise in production
                if (typeof window !== 'undefined') {
                  try {
                    logger.warn('[Theme] Failed to check fonts in database', error);
                  } catch {
                    // Silently ignore if logger is not available
                  }
                }
              });
          }
        }
      }
    }

    // Apply border radius (support both string and object formats)
    if (configToApply.border_radius) {
      root.style.setProperty('--border-radius', configToApply.border_radius);
    }

    // Support borderRadius object format (sm, md, lg, xl, full)
    if (configToApply.borderRadius) {
      const borderRadius = configToApply.borderRadius;
      Object.entries(borderRadius).forEach(([key, value]) => {
        root.style.setProperty(`--border-radius-${key}`, String(value));
      });
    }

    // Apply typography fontSize
    if (typography?.fontSize) {
      const fontSize = typography.fontSize;
      Object.entries(fontSize).forEach(([key, value]) => {
        root.style.setProperty(`--font-size-${key}`, String(value));
      });
    }

    // Apply spacing (support both old format and new layout.spacing format)
    // Old format: config.spacing (for backward compatibility)
    if (configToApply.spacing) {
      const spacing = configToApply.spacing;
      Object.entries(spacing).forEach(([key, value]) => {
        if (key !== 'unit' && key !== 'scale' && typeof value === 'string') {
          root.style.setProperty(`--spacing-${key}`, String(value));
        }
      });
      // Set unit and scale if provided
      if (spacing.unit) root.style.setProperty('--spacing-unit', String(spacing.unit));
      if (spacing.scale) root.style.setProperty('--spacing-scale', String(spacing.scale));
    }

    // New format: config.layout.spacing (for complex theming)
    if (configToApply.layout?.spacing) {
      const spacing = configToApply.layout.spacing;
      if (spacing.unit) root.style.setProperty('--spacing-unit', String(spacing.unit));
      if (spacing.scale) root.style.setProperty('--spacing-scale', String(spacing.scale));
      Object.entries(spacing).forEach(([key, value]) => {
        if (key !== 'unit' && key !== 'scale' && typeof value === 'string') {
          root.style.setProperty(`--spacing-${key}`, String(value));
        }
      });
    }

    // Apply gaps (new layout system)
    if (configToApply.layout?.gaps) {
      const gaps = configToApply.layout.gaps;
      Object.entries(gaps).forEach(([key, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--gap-${key}`, String(value));
        }
      });
    }

    // Apply container widths (new layout system)
    if (configToApply.layout?.containers) {
      const containers = configToApply.layout.containers;
      Object.entries(containers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          root.style.setProperty(`--container-${key}`, String(value));
        }
      });
    }

    // Apply animation configuration (new animation system)
    if (configToApply.animations) {
      const animations = configToApply.animations;

      // Apply durations
      if (animations.duration) {
        Object.entries(animations.duration).forEach(([key, value]) => {
          if (typeof value === 'string') {
            root.style.setProperty(`--animation-duration-${key}`, String(value));
          }
        });
      }

      // Apply easing functions
      if (animations.easing) {
        Object.entries(animations.easing).forEach(([key, value]) => {
          if (typeof value === 'string') {
            root.style.setProperty(`--animation-easing-${key}`, String(value));
          }
        });
      }

      // Apply transition presets
      if (animations.transitions) {
        Object.entries(animations.transitions).forEach(([key, value]) => {
          if (typeof value === 'string') {
            root.style.setProperty(`--transition-${key}`, String(value));
          }
        });
      }
    }

    // Apply CSS effects (comprehensive support for all effect types)
    const effects = configToApply.effects as Record<string, unknown> | undefined;
    if (effects) {
      // Glassmorphism - Support both old format (glassmorphism.enabled) and new format (glassmorphism.card, etc.)
      const glassmorphism = effects.glassmorphism as
        | {
            card?: { background?: string; backdropBlur?: string; border?: string };
            panel?: { background?: string; backdropBlur?: string; border?: string };
            overlay?: { background?: string; backdropBlur?: string };
            enabled?: boolean;
            blur?: string;
            saturation?: string;
            opacity?: number;
            borderOpacity?: number;
          }
        | undefined;
      if (glassmorphism) {
        // New format: glassmorphism.card, glassmorphism.panel, etc.
        if (glassmorphism.card) {
          const card = glassmorphism.card;
          if (card.background)
            root.style.setProperty('--glassmorphism-card-background', card.background);
          if (card.backdropBlur)
            root.style.setProperty('--glassmorphism-card-backdrop-blur', card.backdropBlur);
          if (card.border) root.style.setProperty('--glassmorphism-card-border', card.border);
        }
        if (glassmorphism.panel) {
          const panel = glassmorphism.panel;
          if (panel.background)
            root.style.setProperty('--glassmorphism-panel-background', panel.background);
          if (panel.backdropBlur)
            root.style.setProperty('--glassmorphism-panel-backdrop-blur', panel.backdropBlur);
          if (panel.border) root.style.setProperty('--glassmorphism-panel-border', panel.border);
        }
        if (glassmorphism.overlay) {
          const overlay = glassmorphism.overlay;
          if (overlay.background)
            root.style.setProperty('--glassmorphism-overlay-background', overlay.background);
          if (overlay.backdropBlur)
            root.style.setProperty('--glassmorphism-overlay-backdrop-blur', overlay.backdropBlur);
        }

        // Old format: glassmorphism.enabled (for backward compatibility)
        if (glassmorphism.enabled) {
          const blur = glassmorphism.blur || '20px';
          const saturation = glassmorphism.saturation || '180%';
          const opacity = glassmorphism.opacity || 0.15;
          const borderOpacity = glassmorphism.borderOpacity || 0.3;

          // Set backdrop filter
          root.style.setProperty(
            '--glassmorphism-backdrop',
            `blur(${blur}) saturate(${saturation})`
          );
          root.style.setProperty('--glassmorphism-opacity', String(opacity));
          root.style.setProperty('--glassmorphism-border-opacity', String(borderOpacity));

          // Also set card-specific variables for easier use in components
          const isDark = root.classList.contains('dark');
          const bgColor = isDark
            ? `rgba(15, 23, 42, ${opacity})` // slate-900 with opacity
            : `rgba(255, 255, 255, ${opacity})`; // white with opacity
          const borderColor = isDark
            ? `rgba(255, 255, 255, ${borderOpacity})`
            : `rgba(0, 0, 0, ${borderOpacity})`;

          root.style.setProperty('--glassmorphism-card-background', bgColor);
          root.style.setProperty(
            '--glassmorphism-card-backdrop-blur',
            `blur(${blur}) saturate(${saturation})`
          );
          root.style.setProperty('--glassmorphism-card-border', borderColor);
          // Enhanced shadow for glassmorphism cards
          root.style.setProperty(
            '--glassmorphism-shadow',
            '0 8px 32px 0 rgba(0, 0, 0, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
          );
        } else {
          // Clear glassmorphism variables when disabled
          root.style.removeProperty('--glassmorphism-backdrop');
          root.style.removeProperty('--glassmorphism-opacity');
          root.style.removeProperty('--glassmorphism-border-opacity');
          root.style.removeProperty('--glassmorphism-card-background');
          root.style.removeProperty('--glassmorphism-card-backdrop-blur');
          root.style.removeProperty('--glassmorphism-card-border');
          root.style.removeProperty('--glassmorphism-shadow');
        }
      }

      // Shadows
      const shadows = effects.shadows as Record<string, string> | undefined;
      if (shadows) {
        if (shadows.sm) root.style.setProperty('--shadow-sm', shadows.sm);
        if (shadows.md) root.style.setProperty('--shadow-md', shadows.md);
        if (shadows.lg) root.style.setProperty('--shadow-lg', shadows.lg);
        if (shadows.xl) root.style.setProperty('--shadow-xl', shadows.xl);
        // Support for any other shadow properties
        Object.entries(shadows).forEach(([key, value]) => {
          if (!['sm', 'md', 'lg', 'xl'].includes(key) && typeof value === 'string') {
            root.style.setProperty(`--shadow-${key}`, value);
          }
        });
      }

      // Gradients
      const gradients = effects.gradients as
        | {
            enabled?: boolean;
            direction?: string;
            intensity?: number;
            [key: string]: unknown;
          }
        | undefined;
      if (gradients) {
        if (gradients.enabled) {
          root.style.setProperty('--gradient-direction', gradients.direction || 'to-br');
          root.style.setProperty('--gradient-intensity', String(gradients.intensity || 0.3));
        }
        // Support for gradient colors, stops, etc.
        Object.entries(gradients).forEach(([key, value]) => {
          if (!['enabled', 'direction', 'intensity'].includes(key) && typeof value === 'string') {
            root.style.setProperty(
              `--gradient-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`,
              value
            );
          }
        });
      }

      // Apply custom effects as CSS variables (comprehensive recursive support)
      // Exclude predefined effects (glassmorphism, shadows, gradients)
      const predefinedKeys = ['glassmorphism', 'shadows', 'gradients'];
      Object.entries(effects).forEach(([key, value]) => {
        if (
          !predefinedKeys.includes(key) &&
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          // Recursively convert nested effect properties to CSS variables
          const convertEffectToCSSVars = (obj: Record<string, unknown>, prefix: string) => {
            Object.entries(obj).forEach(([propKey, propValue]) => {
              if (propKey !== 'description' && propKey !== 'enabled') {
                if (typeof propValue === 'string' || typeof propValue === 'number') {
                  // Convert camelCase to kebab-case for CSS variables
                  const cssVarName = `--effect-${prefix}-${propKey.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
                  root.style.setProperty(cssVarName, String(propValue));
                } else if (
                  typeof propValue === 'object' &&
                  propValue !== null &&
                  !Array.isArray(propValue)
                ) {
                  // Recursively handle nested objects
                  convertEffectToCSSVars(
                    propValue as Record<string, unknown>,
                    `${prefix}-${propKey}`
                  );
                }
              }
            });
          };
          convertEffectToCSSVars(value as Record<string, unknown>, key);
        }
      });
    }

    // Update status colors to use theme colors
    root.style.setProperty('--color-status-todo', `var(--color-primary-500)`);
    root.style.setProperty('--color-status-in-progress', `var(--color-warning-500)`);
    root.style.setProperty('--color-status-done', `var(--color-secondary-500)`);
    root.style.setProperty('--color-status-error', `var(--color-danger-500)`);

    // Update chart colors
    root.style.setProperty('--color-chart-default', `var(--color-primary-500)`);
    root.style.setProperty('--color-chart-success', `var(--color-secondary-500)`);
    root.style.setProperty('--color-chart-warning', `var(--color-warning-500)`);
    root.style.setProperty('--color-chart-danger', `var(--color-danger-500)`);

    // Update text link color to use primary color
    root.style.setProperty('--color-text-link', `var(--color-primary-500)`);
    root.style.setProperty('--color-text-link-rgb', `var(--color-primary-rgb)`);

    // Update error and success colors
    root.style.setProperty('--color-error', `var(--color-danger-500)`);
    root.style.setProperty('--color-error-rgb', `var(--color-danger-rgb)`);
    root.style.setProperty('--color-success', `var(--color-secondary-500)`);
    root.style.setProperty('--color-success-rgb', `var(--color-secondary-rgb)`);
  };

  // Apply cached theme immediately on mount (synchronous, before first render)
  // BUT: Only if we're not forcing a refresh (which would clear cache anyway)
  useLayoutEffect(() => {
    if (cachedTheme && typeof window !== 'undefined') {
      // Don't apply if manual theme is active
      const isManualTheme = document.documentElement.hasAttribute('data-manual-theme');
      if (!isManualTheme) {
        applyThemeConfig(cachedTheme);
        logger.info('[Theme] Loaded theme from cache');
      }
    }
  }, []); // Only run once on mount - cache is only used on initial load

  useEffect(() => {
    // Fetch theme from API immediately - no delay
    // Cache is already applied synchronously above
    startTransition(() => {
      fetchTheme();
    });

    // Watch for dark class changes on document root (set by ThemeToggle manually)
    // This ensures theme CSS variables update when user manually toggles dark mode
    // BUT: Don't override if manual theme is active (for preview mode)
    const observer = new MutationObserver(() => {
      // Check if manual theme is active (data-manual-theme attribute)
      const isManualTheme = document.documentElement.hasAttribute('data-manual-theme');
      if (theme && !isManualTheme) {
        // Re-apply theme config when dark class changes (only if not manual)
        applyThemeConfig(theme.config);
      }
    });

    // Observe class changes on document root
    if (typeof document !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // NO automatic dark mode - only manual toggle via ThemeToggle
    // Removed watchDarkModePreference - dark mode is ONLY manual

    // Refresh theme every 5 minutes to catch updates
    const interval = setInterval(
      () => {
        startTransition(() => {
          fetchTheme();
        });
      },
      5 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]); // Re-run when theme changes to update observer

  const refreshTheme = async () => {
    // Force apply when refreshing (e.g., after theme activation)
    // Clear cache FIRST to ensure we don't use stale cached data
    clearThemeCache();

    // Force fetch and apply - fetchTheme(true) will handle clearing cache again
    // and applying immediately, ignoring any cached theme
    await fetchTheme(true);
  };

  return (
    <GlobalThemeContext.Provider
      value={{
        theme,
        isLoading: false, // Always false - theme is preloaded from cache
        error,
        refreshTheme,
      }}
    >
      {children}
    </GlobalThemeContext.Provider>
  );
}

export function useGlobalTheme() {
  const context = useContext(GlobalThemeContext);
  if (context === undefined) {
    // Return a safe default context when provider is not available
    // This allows components to work during SSR or in pages outside the main layout
    return {
      theme: null,
      isLoading: false,
      error: null,
      refreshTheme: async () => {},
    };
  }
  return context;
}
