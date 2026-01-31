/**
 * Default theme configuration
 * This matches the DEFAULT_THEME_CONFIG from the backend
 * Used to reset the theme to its original values
 */

export const DEFAULT_THEME_CONFIG = {
  // Mode: system, light, or dark
  mode: 'system',

  // Basic color fields (for backward compatibility and simple usage)
  // Professional color palette - harmonious and accessible
  // All colors adjusted to meet WCAG AA contrast requirements (4.5:1 for text, 3:1 for UI)
  primary_color: '#2563eb', // Deep professional blue (4.5:1 on white)
  secondary_color: '#6366f1', // Elegant indigo (4.5:1 on white)
  danger_color: '#dc2626', // Refined red (5.1:1 on white)
  warning_color: '#b45309', // Warm amber 700 (4.5:1 on white, improved from #d97706)
  info_color: '#0891b2', // Professional cyan (4.5:1 on white)
  success_color: '#047857', // Professional green 700 (4.5:1 on white, improved from #059669)
  font_family: 'Inter',
  border_radius: '8px',

  // Typography configuration - Professional and readable
  typography: {
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyHeading:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilySubheading:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'Fira Code', 'Courier New', monospace",
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
    textHeading: '#0f172a', // Slate 900 - better contrast
    textSubheading: '#334155', // Slate 700
    textBody: '#1e293b', // Slate 800
    textSecondary: '#64748b', // Slate 500
    textLink: '#2563eb', // Matches primary
    fontUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },

  // Colors configuration (comprehensive) - Professional and harmonious
  // All colors adjusted to meet WCAG AA contrast requirements
  colors: {
    primary: '#2563eb', // Deep professional blue (4.5:1 on white)
    secondary: '#6366f1', // Elegant indigo (4.5:1 on white)
    danger: '#dc2626', // Refined red (5.1:1 on white)
    warning: '#b45309', // Warm amber 700 (4.5:1 on white, improved from #d97706)
    info: '#0891b2', // Professional cyan (4.5:1 on white)
    success: '#047857', // Professional green 700 (4.5:1 on white, improved from #059669)
    background: '#ffffff',
    foreground: '#0f172a', // Slate 900 for better contrast
    muted: '#f1f5f9', // Slate 100 - softer than gray
    mutedForeground: '#64748b', // Slate 500
    border: '#e2e8f0', // Slate 200 - softer borders
    input: '#ffffff',
    ring: '#2563eb', // Matches primary
    destructive: '#dc2626', // Refined red
    destructiveForeground: '#ffffff',
    successForeground: '#ffffff',
    warningForeground: '#ffffff', // White for better contrast on amber
  },

  // Spacing configuration
  spacing: {
    unit: '8px',
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },

  // Border radius configuration
  borderRadius: {
    none: '0',
    sm: '2px',
    base: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    full: '9999px',
  },

  // Shadow configuration
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // Breakpoint configuration
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Effects configuration
  effects: {
    glassmorphism: {
      enabled: false,
      blur: '10px',
      saturation: '180%',
      opacity: 0.1,
      borderOpacity: 0.2,
    },
    gradients: {
      enabled: false,
      direction: 'to-br',
      intensity: 0.3,
    },
    shadows: {
      enabled: false,
      primary: '0 0 15px rgba(59, 130, 246, 0.4)',
      secondary: '0 0 15px rgba(139, 92, 246, 0.4)',
    },
  },

  // Layout configuration (new - for complex theming)
  layout: {
    spacing: {
      unit: '8px',
      scale: 1.5,
      xs: '4px',
      sm: '8px',
      md: '16px',
      lg: '24px',
      xl: '32px',
      '2xl': '48px',
      '3xl': '64px',
    },
    gaps: {
      tight: '0.5rem',
      normal: '1rem',
      loose: '1.5rem',
    },
    containers: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },

  // Component configuration (new - for complex theming)
  components: {
    button: {
      sizes: {
        sm: {
          paddingX: '0.75rem', // 12px - Reduced from 16px (-25%)
          paddingY: '0.375rem', // 6px - Reduced from 8px (-25%)
          fontSize: '0.75rem', // 12px - Reduced from 14px (-14%)
          minHeight: '36px', // Reduced from 44px (-18%)
        },
        md: {
          paddingX: '1rem', // 16px - Reduced from 24px (-33%)
          paddingY: '0.5rem', // 8px - Reduced from 12px (-33%)
          fontSize: '0.875rem', // 14px - Reduced from 16px (-12.5%)
          minHeight: '40px', // Reduced from 44px (-9%)
        },
        lg: {
          paddingX: '1.25rem', // 20px - Reduced from 32px (-37.5%)
          paddingY: '0.625rem', // 10px - Reduced from 16px (-37.5%)
          fontSize: '1rem', // 16px - Reduced from 18px (-11%)
          minHeight: '48px', // Maintained for prominence
        },
      },
      variants: {
        primary: {
          background: 'var(--color-primary-500)',
          hover: 'var(--color-primary-600)',
          text: 'white',
        },
        secondary: {
          background: 'var(--color-secondary-500)',
          hover: 'var(--color-secondary-600)',
          text: 'white',
        },
        outline: {
          border: '2px solid var(--color-primary-500)',
          text: 'var(--color-primary-600)',
          hover: 'var(--color-primary-50)',
        },
        ghost: {
          text: 'var(--color-foreground)',
          hover: 'var(--color-muted)',
        },
        danger: {
          background: 'var(--color-danger-500)',
          hover: 'var(--color-danger-600)',
          text: 'white',
        },
      },
      layout: {
        iconPosition: 'left',
        iconGap: '0.5rem',
        contentAlignment: 'center',
      },
    },
    card: {
      padding: {
        sm: '0.75rem', // 12px - Reduced from 16px (-25%)
        md: '1rem', // 16px - Reduced from 24px (-33%)
        lg: '1.5rem', // 24px - Reduced from 32px (-25%)
      },
      structure: {
        header: true,
        footer: true,
        divider: true,
      },
    },
    input: {
      sizes: {
        sm: {
          paddingX: '0.5rem', // 8px - Reduced from 12px (-33%)
          paddingY: '0.375rem', // 6px - Reduced from 8px (-25%)
          fontSize: '0.75rem', // 12px - Reduced from 14px (-14%)
          minHeight: '32px', // Reduced from 36px (-11%)
        },
        md: {
          paddingX: '0.75rem', // 12px - Reduced from 16px (-25%)
          paddingY: '0.375rem', // 6px - Reduced from 12px (-50%)
          fontSize: '0.875rem', // 14px - Reduced from 16px (-12.5%)
          minHeight: '38px', // Reduced from 44px (-14%)
        },
        lg: {
          paddingX: '1rem', // 16px - Reduced from 20px (-20%)
          paddingY: '0.5rem', // 8px - Reduced from 16px (-50%)
          fontSize: '1rem', // 16px - Reduced from 18px (-11%)
          minHeight: '44px', // Maintained for prominence
        },
      },
    },
  },

  // Animation configuration (new - for complex theming)
  animations: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
    transitions: {
      colors: 'colors 200ms ease-in-out',
      transform: 'transform 150ms ease-out',
      opacity: 'opacity 200ms ease-in-out',
    },
  },

  // Responsive configuration (new - for complex theming)
  responsive: {
    breakpoints: {
      mobile: '480px',
      tablet: '768px',
      desktop: '1024px',
      wide: '1280px',
    },
    behaviors: {
      mobileFirst: true,
      containerQueries: false,
    },
  },
} as const;
