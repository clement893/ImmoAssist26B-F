/** * Design Tokens * Centralized design values using CSS variables from global theme * * This file provides a single source of truth for design values, * making it easy to maintain consistency and update the design system. */ /** * Color tokens using CSS variables from global theme */ export const colors =
  {
    primary: {
      base: 'var(--color-primary, #0070f3)',
      hover: 'var(--color-primary-hover, var(--color-primary))',
      focus: 'var(--color-primary-focus, var(--color-primary))',
      foreground: 'var(--color-primary-foreground, #ffffff)',
    },
    secondary: {
      base: 'var(--color-secondary, #6b7280)',
      hover: 'var(--color-secondary-hover, var(--color-secondary))',
      foreground: 'var(--color-secondary-foreground, #ffffff)',
    },
    accent: {
      base: 'var(--color-accent, #f59e0b)',
      hover: 'var(--color-accent-hover, var(--color-accent))',
      foreground: 'var(--color-accent-foreground, #000000)',
    },
    background: { base: 'var(--color-background, #ffffff)', muted: 'var(--color-muted, #f3f4f6)' },
    foreground: {
      base: 'var(--color-foreground, #000000)',
      muted: 'var(--color-muted-foreground, #6b7280)',
    },
    border: 'var(--color-border, #e5e7eb)',
    input: 'var(--color-input, #ffffff)',
    ring: 'var(--color-ring, #0070f3)',
    destructive: {
      base: 'var(--color-destructive, #ef4444)',
      foreground: 'var(--color-destructive-foreground, #ffffff)',
    },
    success: {
      base: 'var(--color-success, #10b981)',
      foreground: 'var(--color-success-foreground, #ffffff)',
    },
    warning: {
      base: 'var(--color-warning, #f59e0b)',
      foreground: 'var(--color-warning-foreground, #000000)',
    },
  } as const;
/** * Spacing tokens using CSS variables from global theme */ export const spacing = {
  xs: 'var(--spacing-xs, 4px)',
  sm: 'var(--spacing-sm, 8px)',
  md: 'var(--spacing-md, 16px)',
  lg: 'var(--spacing-lg, 24px)',
  xl: 'var(--spacing-xl, 32px)',
  '2xl': 'var(--spacing-2xl, 48px)',
  '3xl': 'var(--spacing-3xl, 64px)',
  unit: 'var(--spacing-unit, 8px)',
} as const;
/** * Border radius tokens using CSS variables from global theme */ export const borderRadius = {
  none: 'var(--border-radius-none, 0)',
  sm: 'var(--border-radius-sm, 2px)',
  base: 'var(--border-radius-base, 4px)',
  md: 'var(--border-radius-md, 6px)',
  lg: 'var(--border-radius-lg, 8px)',
  xl: 'var(--border-radius-xl, 12px)',
  '2xl': 'var(--border-radius-2xl, 16px)',
  full: 'var(--border-radius-full, 9999px)',
} as const;
/** * Typography tokens using CSS variables from global theme */ export const typography = {
  fontFamily: {
    sans: 'var(--typography-font-family-sans, Inter, system-ui, -apple-system, sans-serif)',
    mono: 'var(--typography-font-family-mono, Fira Code, monospace)',
  },
  fontSize: {
    xs: 'var(--typography-font-size-xs, 12px)',
    sm: 'var(--typography-font-size-sm, 14px)',
    base: 'var(--typography-font-size-base, 16px)',
    lg: 'var(--typography-font-size-lg, 18px)',
    xl: 'var(--typography-font-size-xl, 20px)',
    '2xl': 'var(--typography-font-size-2xl, 24px)',
    '3xl': 'var(--typography-font-size-3xl, 30px)',
    '4xl': 'var(--typography-font-size-4xl, 36px)',
  },
  fontWeight: {
    light: 'var(--typography-font-weight-light, 300)', // Dashboard V2 Style
    normal: 'var(--typography-font-weight-normal, 400)',
    medium: 'var(--typography-font-weight-medium, 500)',
    semibold: 'var(--typography-font-weight-semibold, 600)',
    bold: 'var(--typography-font-weight-bold, 700)',
  },
  lineHeight: {
    tight: 'var(--typography-line-height-tight, 1.25)',
    normal: 'var(--typography-line-height-normal, 1.5)',
    relaxed: 'var(--typography-line-height-relaxed, 1.75)',
  },
} as const;
/** 
 * Shadow tokens using CSS variables from global theme
 * UI Revamp - Nouveau système d'ombres multi-niveaux
 */
export const shadows = {
  // Legacy shadows (kept for backward compatibility)
  sm: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
  base: 'var(--shadow-base, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06))',
  md: 'var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
  lg: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05))',
  xl: 'var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
} as const;

/**
 * UI Revamp - Nouveau système d'ombres multi-niveaux
 * Utiliser shadowSystem pour les nouveaux composants
 */
export const shadowSystem = {
  // Ombres subtiles (pour éléments légers)
  subtle: {
    sm: 'var(--shadow-subtle-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.03))',
    md: 'var(--shadow-subtle-md, 0 2px 4px 0 rgba(0, 0, 0, 0.05))',
    lg: 'var(--shadow-subtle-lg, 0 4px 8px 0 rgba(0, 0, 0, 0.08))',
  },
  
  // Ombres standard (pour cards) - Utiliser celles-ci par défaut
  standard: {
    sm: 'var(--shadow-standard-sm, 0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04))',
    md: 'var(--shadow-standard-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06))',
    lg: 'var(--shadow-standard-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.08))',
    xl: 'var(--shadow-standard-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06))',
  },
  
  // Ombres colorées (pour éléments interactifs)
  colored: {
    primary: 'var(--shadow-colored-primary, 0 4px 14px 0 rgba(37, 99, 235, 0.15))',
    secondary: 'var(--shadow-colored-secondary, 0 4px 14px 0 rgba(99, 102, 241, 0.15))',
    success: 'var(--shadow-colored-success, 0 4px 14px 0 rgba(4, 120, 87, 0.15))',
    warning: 'var(--shadow-colored-warning, 0 4px 14px 0 rgba(180, 83, 9, 0.15))',
    error: 'var(--shadow-colored-error, 0 4px 14px 0 rgba(220, 38, 38, 0.15))',
  },
  
  // Ombres pour hover states
  hover: {
    sm: 'var(--shadow-hover-sm, 0 8px 16px -4px rgba(0, 0, 0, 0.12))',
    md: 'var(--shadow-hover-md, 0 12px 24px -6px rgba(0, 0, 0, 0.15))',
    lg: 'var(--shadow-hover-lg, 0 16px 32px -8px rgba(0, 0, 0, 0.18))',
  },
  
  // Ombres pour glassmorphism
  glass: {
    sm: 'var(--shadow-glass-sm, 0 8px 32px 0 rgba(31, 38, 135, 0.15))',
    md: 'var(--shadow-glass-md, 0 8px 32px 0 rgba(31, 38, 135, 0.2))',
    lg: 'var(--shadow-glass-lg, 0 8px 32px 0 rgba(31, 38, 135, 0.25))',
  },
  
  // Ombres internes (pour effets de profondeur)
  inner: {
    sm: 'var(--shadow-inner-sm, inset 0 2px 4px 0 rgba(0, 0, 0, 0.06))',
    md: 'var(--shadow-inner-md, inset 0 2px 8px 0 rgba(0, 0, 0, 0.1))',
  },
} as const;

/**
 * Helper pour obtenir une ombre du système
 */
export function getShadow(
  category: keyof typeof shadowSystem,
  size: string
): string {
  const categoryShadows = shadowSystem[category] as Record<string, string>;
  return categoryShadows[size] || categoryShadows.md || '';
}
/** * Breakpoint tokens (for reference, actual breakpoints are in Tailwind config) */ export const breakpoints =
  {
    sm: 'var(--breakpoint-sm, 640px)',
    md: 'var(--breakpoint-md, 768px)',
    lg: 'var(--breakpoint-lg, 1024px)',
    xl: 'var(--breakpoint-xl, 1280px)',
    '2xl': 'var(--breakpoint-2xl, 1536px)',
  } as const;
/** * Z-index tokens for layering */ export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;
/** * Transition tokens */ export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
/** * Helper function to get CSS variable value */ export function getTokenValue(
  token: string
): string {
  if (typeof window === 'undefined') {
    return token;
  }
  const root = document.documentElement;
  const value = getComputedStyle(root).getPropertyValue(
    token.replace('var(--', '').replace(')', '')
  );
  return value.trim() || token;
}
/** * Helper function to set CSS variable value */ export function setTokenValue(
  token: string,
  value: string
): void {
  if (typeof window === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const varName = token.replace('var(--', '').replace(')', '');
  root.style.setProperty(`--${varName}`, value);
}
