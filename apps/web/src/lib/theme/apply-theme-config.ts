/**
 * Utility function to apply theme config directly to the DOM
 * This can be used to apply theme changes immediately without fetching from backend
 */
import type { ThemeConfig, ThemeConfigAccessor, TypographyConfig } from '@modele/types';
import { generateColorShades, generateRgb } from './color-utils';
import { validateThemeConfig } from './theme-validator';
import { getThemeConfigForMode, applyDarkModeClass } from './dark-mode-utils';
import { loadThemeFonts } from './font-loader';
import { checkFonts } from '@/lib/api/theme-font';
import { logger } from '@/lib/logger';
import { TokenStorage } from '@/lib/auth/tokenStorage';

/**
 * Flag to prevent GlobalThemeProvider from overriding manual theme changes
 * Set when applying theme manually, cleared after a delay
 */
let manualThemeActive = false;
let manualThemeTimeout: NodeJS.Timeout | null = null;

/**
 * Mark that a manual theme is being applied (prevents GlobalThemeProvider from overriding)
 * @param duration Duration in milliseconds to prevent override (default: 10 seconds)
 */
export function setManualThemeActive(duration: number = 10000) {
  manualThemeActive = true;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-manual-theme', 'true');
  }

  // Clear existing timeout
  if (manualThemeTimeout) {
    clearTimeout(manualThemeTimeout);
  }

  // Clear flag after duration
  manualThemeTimeout = setTimeout(() => {
    manualThemeActive = false;
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-manual-theme');
    }
  }, duration);
}

/**
 * Check if a manual theme is currently active
 */
export function isManualThemeActive(): boolean {
  return manualThemeActive;
}

export function applyThemeConfigDirectly(
  config: ThemeConfig,
  options?: {
    validateContrast?: boolean;
    logWarnings?: boolean;
    /**
     * If true, bypass dark mode protection and apply colors directly from config
     * Useful for manual theme editing/preview where user wants full control
     */
    bypassDarkModeProtection?: boolean;
  }
) {
  if (typeof document === 'undefined') {
    return; // Server-side rendering, skip
  }

  const {
    validateContrast = true,
    logWarnings = true,
    bypassDarkModeProtection = false,
  } = options || {};

  logger.info("[applyThemeConfigDirectly] Début de l'application du thème", {
    bypassDarkModeProtection,
    hasColors: !!config.colors,
  });

  // If bypassDarkModeProtection is true, mark manual theme as active to prevent GlobalThemeProvider from overriding
  if (bypassDarkModeProtection) {
    setManualThemeActive(30000); // Prevent override for 30 seconds
    logger.info('[applyThemeConfigDirectly] Flag manuel activé pour 30 secondes');
  }

  // Get theme config for current mode (light/dark/system)
  // If bypassDarkModeProtection is true, use config directly (for manual editing/preview)
  const modeConfig = bypassDarkModeProtection ? config : getThemeConfigForMode(config);

  // Apply dark mode class if needed
  const mode = config.mode || 'system';
  if (
    mode === 'dark' ||
    (mode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    applyDarkModeClass(true);
  } else {
    applyDarkModeClass(false);
  }

  // Validate theme configuration if requested
  if (validateContrast) {
    // Transform modeConfig to match validateThemeConfig's expected type
    const validationConfig = {
      colors: modeConfig.colors,
      primary_color: modeConfig.primary_color,
      secondary_color: modeConfig.secondary_color,
      danger_color: modeConfig.danger_color,
      warning_color: modeConfig.warning_color,
      info_color: modeConfig.info_color,
      success_color: modeConfig.success_color,
      typography: modeConfig.typography
        ? {
            textHeading: (modeConfig.typography as Record<string, unknown>).textHeading as
              | string
              | undefined,
            textSubheading: (modeConfig.typography as Record<string, unknown>).textSubheading as
              | string
              | undefined,
            textBody: (modeConfig.typography as Record<string, unknown>).textBody as
              | string
              | undefined,
            textSecondary: (modeConfig.typography as Record<string, unknown>).textSecondary as
              | string
              | undefined,
            textLink: (modeConfig.typography as Record<string, unknown>).textLink as
              | string
              | undefined,
          }
        : undefined,
    };
    const validation = validateThemeConfig(validationConfig, {
      strictContrast: false,
      logWarnings,
    });

    if (!validation.valid) {
      if (validation.colorFormatErrors.length > 0) {
        logger.warn('[Theme] Color format errors detected:', validation.colorFormatErrors);
      }

      if (validation.contrastIssues.length > 0) {
        const failCount = validation.contrastIssues.filter(
          (issue) => issue.level === 'fail'
        ).length;
        if (failCount > 0) {
          logger.warn(
            `[Theme] ${failCount} contrast issue(s) detected that do not meet WCAG requirements`
          );
        }
      }
    }
  }

  const root = document.documentElement;

  // Use mode-specific config
  const configToApply = modeConfig;

  // Support multiple formats:
  // 1. Flat format: primary_color, secondary_color, etc.
  // 2. Short format: primary, secondary, etc. (directly in config)
  // 3. Nested format: colors.primary, colors.secondary, etc.
  const configAccessor = configToApply as ThemeConfigAccessor;
  // If bypassDarkModeProtection, also check original config for theme colors
  const originalConfig = bypassDarkModeProtection ? config : configToApply;
  const originalConfigAccessor = originalConfig as ThemeConfigAccessor;
  const colorsConfig = configAccessor.colors || {};
  const originalColorsConfig = originalConfigAccessor.colors || {};
  const primaryColor =
    configAccessor.primary ||
    configToApply.primary_color ||
    colorsConfig.primary_color ||
    colorsConfig.primary ||
    originalColorsConfig.primary_color ||
    originalColorsConfig.primary;
  const secondaryColor =
    configAccessor.secondary ||
    configToApply.secondary_color ||
    colorsConfig.secondary_color ||
    colorsConfig.secondary ||
    originalColorsConfig.secondary_color ||
    originalColorsConfig.secondary;
  const dangerColor =
    configAccessor.danger ||
    configToApply.danger_color ||
    colorsConfig.danger_color ||
    colorsConfig.destructive ||
    colorsConfig.danger ||
    originalColorsConfig.danger_color ||
    originalColorsConfig.destructive ||
    originalColorsConfig.danger;
  const warningColor =
    configAccessor.warning ||
    configToApply.warning_color ||
    colorsConfig.warning_color ||
    colorsConfig.warning ||
    originalColorsConfig.warning_color ||
    originalColorsConfig.warning;
  const infoColor =
    configAccessor.info ||
    configToApply.info_color ||
    colorsConfig.info_color ||
    colorsConfig.info ||
    originalColorsConfig.info_color ||
    originalColorsConfig.info;
  const successColor =
    configAccessor.success ||
    configToApply.success_color ||
    colorsConfig.success_color ||
    colorsConfig.success ||
    originalColorsConfig.success_color ||
    originalColorsConfig.success;

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
    const successShades = generateColorShades(successColor);
    Object.entries(successShades).forEach(([shade, color]) => {
      root.style.setProperty(`--color-success-${shade}`, color);
      if (shade === '500') {
        root.style.setProperty(`--color-success-rgb`, generateRgb(color));
      }
    });
  }

  // Apply colors from nested colors object
  // If bypassDarkModeProtection is true, also check original config for base colors
  const originalBaseColorsConfig = bypassDarkModeProtection
    ? configAccessor.colors || {}
    : colorsConfig;

  const appliedColors: string[] = [];

  // Apply base colors (always apply if bypassDarkModeProtection is true, otherwise only if in modeConfig)
  if (originalBaseColorsConfig.background || colorsConfig.background) {
    const bgColor = originalBaseColorsConfig.background || colorsConfig.background;
    root.style.setProperty('--color-background', bgColor ?? null);
    appliedColors.push(`background: ${bgColor}`);
  }
  if (originalBaseColorsConfig.foreground || colorsConfig.foreground) {
    const fgColor = originalBaseColorsConfig.foreground || colorsConfig.foreground;
    root.style.setProperty('--color-foreground', fgColor ?? null);
    appliedColors.push(`foreground: ${fgColor}`);
  }
  if (originalBaseColorsConfig.muted || colorsConfig.muted) {
    const mutedColor = originalBaseColorsConfig.muted || colorsConfig.muted;
    root.style.setProperty('--color-muted', mutedColor ?? null);
    appliedColors.push(`muted: ${mutedColor}`);
  }
  if (originalBaseColorsConfig.mutedForeground || colorsConfig.mutedForeground) {
    const mutedFgColor = originalBaseColorsConfig.mutedForeground || colorsConfig.mutedForeground;
    root.style.setProperty('--color-muted-foreground', mutedFgColor ?? null);
    appliedColors.push(`mutedForeground: ${mutedFgColor}`);
  }
  if (originalBaseColorsConfig.border || colorsConfig.border) {
    const borderColor = originalBaseColorsConfig.border || colorsConfig.border;
    root.style.setProperty('--color-border', borderColor ?? null);
    appliedColors.push(`border: ${borderColor}`);
  }
  if (originalBaseColorsConfig.input || colorsConfig.input) {
    const inputColor = originalBaseColorsConfig.input || colorsConfig.input;
    root.style.setProperty('--color-input', inputColor ?? null);
    appliedColors.push(`input: ${inputColor}`);
  }
  if (originalBaseColorsConfig.ring || colorsConfig.ring) {
    const ringColor = originalBaseColorsConfig.ring || colorsConfig.ring;
    root.style.setProperty('--color-ring', ringColor ?? null);
    appliedColors.push(`ring: ${ringColor}`);
  }

  logger.info('[applyThemeConfigDirectly] Couleurs de base appliquées', {
    count: appliedColors.length,
    colors: appliedColors,
    hasManualFlag: root.hasAttribute('data-manual-theme'),
  });

  // Load font URL if configured
  if (
    configToApply.font_url &&
    typeof configToApply.font_url === 'string' &&
    typeof document !== 'undefined'
  ) {
    const existingLink = document.querySelector(`link[data-theme-font]`);
    if (existingLink) {
      existingLink.remove();
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = configToApply.font_url;
    link.setAttribute('data-theme-font', 'true');
    document.head.appendChild(link);
  }

  // Apply fonts from typography config if available
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

  // Load theme fonts from S3 if fontFiles are specified
  if (typography?.fontFiles && Array.isArray(typography.fontFiles)) {
    const fontIds = typography.fontFiles;
    if (fontIds.length > 0) {
      // Load fonts asynchronously (don't block rendering)
      loadThemeFonts(fontIds).catch((error: unknown) => {
        logger.warn('[applyThemeConfigDirectly] Failed to load theme fonts', { error, fontIds });
      });
    }
  }

  // Apply fonts
  if (configToApply.font_family) {
    const fontFamily = configToApply.font_family.trim();
    root.style.setProperty('--font-family', `${fontFamily}, sans-serif`);
    root.style.setProperty('--font-family-heading', `${fontFamily}, sans-serif`);
    root.style.setProperty('--font-family-subheading', `${fontFamily}, sans-serif`);
  }

  if (typography?.fontFamily) {
    const fontFamily = String(typography.fontFamily).trim();
    root.style.setProperty('--font-family', fontFamily);
    if (typography.fontFamilyHeading) {
      root.style.setProperty('--font-family-heading', String(typography.fontFamilyHeading));
    }
    if (typography.fontFamilySubheading) {
      root.style.setProperty('--font-family-subheading', String(typography.fontFamilySubheading));
    }

    // Check if fonts exist in database and warn user if not
    if (logWarnings && typeof window !== 'undefined') {
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
                if (missingFonts.length > 0) {
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
              if (process.env.NODE_ENV === 'development') {
                logger.warn('[Theme] Failed to check fonts in database', error);
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

  // Apply spacing
  if (configToApply.spacing) {
    const spacing = configToApply.spacing;
    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, String(value));
    });
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
        root.style.setProperty('--glassmorphism-backdrop', `blur(${blur}) saturate(${saturation})`);
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

    // Apply custom effects as CSS variables (any effect not predefined)
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
}
