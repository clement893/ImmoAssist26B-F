import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Swiss Style colors for Masterclass
        swiss: {
          black: '#000000',
          white: '#FFFFFF',
          blue: '#1A3A52',
          red: '#E74C3C', // Urgency color
          green: '#27AE60', // Success color
        },
        // Primary color palette - Purple/Blue modern palette
        primary: {
          50: 'var(--color-primary-50, #f5f3ff)',
          100: 'var(--color-primary-100, #ede9fe)',
          200: 'var(--color-primary-200, #ddd6fe)',
          300: 'var(--color-primary-300, #c4b5fd)',
          400: 'var(--color-primary-400, #a78bfa)',
          500: 'var(--color-primary-500, #8b5cf6)',
          600: 'var(--color-primary-600, #7c3aed)',
          700: 'var(--color-primary-700, #6d28d9)',
          800: 'var(--color-primary-800, #5b21b6)',
          900: 'var(--color-primary-900, #4c1d95)',
          950: 'var(--color-primary-950, #3b1d6e)',
        },
        // Custom blue light color (#B4D6FF) - darker in dark mode
        blue: {
          light: '#B4D6FF',
          lightDark: '#1e3a8a', // Dark mode version
        },
        // Secondary color palette - Blue modern palette
        secondary: {
          50: 'var(--color-secondary-50, #eff6ff)',
          100: 'var(--color-secondary-100, #dbeafe)',
          200: 'var(--color-secondary-200, #bfdbfe)',
          300: 'var(--color-secondary-300, #93c5fd)',
          400: 'var(--color-secondary-400, #60a5fa)',
          500: 'var(--color-secondary-500, #3b82f6)',
          600: 'var(--color-secondary-600, #2563eb)',
          700: 'var(--color-secondary-700, #1d4ed8)',
          800: 'var(--color-secondary-800, #1e40af)',
          900: 'var(--color-secondary-900, #1e3a8a)',
          950: 'var(--color-secondary-950, #172554)',
        },
        // Neutral colors - Modern slate palette
        neutral: {
          50: 'var(--color-neutral-50, #f8fafc)',
          100: 'var(--color-neutral-100, #f1f5f9)',
          200: 'var(--color-neutral-200, #e2e8f0)',
          300: 'var(--color-neutral-300, #cbd5e1)',
          400: 'var(--color-neutral-400, #94a3b8)',
          500: 'var(--color-neutral-500, #64748b)',
          600: 'var(--color-neutral-600, #475569)',
          700: 'var(--color-neutral-700, #334155)',
          800: 'var(--color-neutral-800, #1e293b)',
          900: 'var(--color-neutral-900, #0f172a)',
          950: '#020617',
        },
        // Danger color palette - Uses CSS variables with fallbacks for theme support
        danger: {
          50: 'var(--color-danger-50, #fef2f2)',
          100: 'var(--color-danger-100, #fee2e2)',
          200: 'var(--color-danger-200, #fecaca)',
          300: 'var(--color-danger-300, #fca5a5)',
          400: 'var(--color-danger-400, #f87171)',
          500: 'var(--color-danger-500, #ef4444)',
          600: 'var(--color-danger-600, #dc2626)',
          700: 'var(--color-danger-700, #b91c1c)',
          800: 'var(--color-danger-800, #991b1b)',
          900: 'var(--color-danger-900, #7f1d1d)',
          950: 'var(--color-danger-950, #450a0a)',
        },
        // Warning color palette - Uses CSS variables with fallbacks for theme support
        warning: {
          50: 'var(--color-warning-50, #fffbeb)',
          100: 'var(--color-warning-100, #fef3c7)',
          200: 'var(--color-warning-200, #fde68a)',
          300: 'var(--color-warning-300, #fcd34d)',
          400: 'var(--color-warning-400, #fbbf24)',
          500: 'var(--color-warning-500, #f59e0b)',
          600: 'var(--color-warning-600, #d97706)',
          700: 'var(--color-warning-700, #b45309)',
          800: 'var(--color-warning-800, #92400e)',
          900: 'var(--color-warning-900, #78350f)',
          950: 'var(--color-warning-950, #451a03)',
        },
        // Info color palette - Uses CSS variables with fallbacks for theme support
        info: {
          50: 'var(--color-info-50, #ecfeff)',
          100: 'var(--color-info-100, #cffafe)',
          200: 'var(--color-info-200, #a5f3fc)',
          300: 'var(--color-info-300, #67e8f9)',
          400: 'var(--color-info-400, #22d3ee)',
          500: 'var(--color-info-500, #06b6d4)',
          600: 'var(--color-info-600, #0891b2)',
          700: 'var(--color-info-700, #0e7490)',
          800: 'var(--color-info-800, #155e75)',
          900: 'var(--color-info-900, #164e63)',
          950: 'var(--color-info-950, #083344)',
        },
        // Success colors - Uses CSS variables with fallbacks for theme support
        success: {
          50: 'var(--color-success-50, #f0fdf4)',
          100: 'var(--color-success-100, #dcfce7)',
          200: 'var(--color-success-200, #bbf7d0)',
          300: 'var(--color-success-300, #86efac)',
          400: 'var(--color-success-400, #4ade80)',
          500: 'var(--color-success-500, #22c55e)',
          600: 'var(--color-success-600, #16a34a)',
          700: 'var(--color-success-700, #15803d)',
          800: 'var(--color-success-800, #166534)',
          900: 'var(--color-success-900, #14532d)',
          950: 'var(--color-success-950, #052e16)',
        },
        // Error colors - Uses CSS variables with fallbacks for theme support
        error: {
          50: 'var(--color-error-50, #fef2f2)',
          100: 'var(--color-error-100, #fee2e2)',
          200: 'var(--color-error-200, #fecaca)',
          300: 'var(--color-error-300, #fca5a5)',
          400: 'var(--color-error-400, #f87171)',
          500: 'var(--color-error-500, #ef4444)',
          600: 'var(--color-error-600, #dc2626)',
          700: 'var(--color-error-700, #b91c1c)',
          800: 'var(--color-error-800, #991b1b)',
          900: 'var(--color-error-900, #7f1d1d)',
          950: 'var(--color-error-950, #450a0a)',
        },
        // Neutral grays (for text, borders, backgrounds) - Keep hardcoded as they're neutral
        // Also map to neutral for consistency
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Theme-aware base colors - These use CSS variables that change with theme
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        muted: {
          DEFAULT: 'var(--color-muted)',
          foreground: 'var(--color-muted-foreground)',
        },
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
      },
      spacing: {
        // Standardized spacing scale (UX/UI improvements - Batch 1)
        // Fixed pixel values for consistent spacing across the application
        xs: '4px', // 0.25rem - Very small spacing
        sm: '8px', // 0.5rem - Small spacing
        md: '16px', // 1rem - Standard spacing
        lg: '24px', // 1.5rem - Large spacing
        xl: '32px', // 2rem - Very large spacing
        '2xl': '48px', // 3rem - Extra large spacing
        '3xl': '64px', // 4rem - Maximum spacing
        // Swiss Style spacing - Large margins for breathing room
        'swiss-sm': '80px', // Swiss small margin
        'swiss-md': '120px', // Swiss standard margin (between sections)
        'swiss-lg': '160px', // Swiss large margin
        // Theme-aware spacing using CSS variables with fallbacks (backward compatibility)
        // These map to the theme's spacing scale
        'theme-xs': 'var(--spacing-xs, 0.5rem)', // 8px default
        'theme-sm': 'var(--spacing-sm, 0.75rem)', // 12px default
        'theme-md': 'var(--spacing-md, 1rem)', // 16px default
        'theme-lg': 'var(--spacing-lg, 1.5rem)', // 24px default
        'theme-xl': 'var(--spacing-xl, 2rem)', // 32px default
        'theme-2xl': 'var(--spacing-2xl, 3rem)', // 48px default
        'theme-3xl': 'var(--spacing-3xl, 4rem)', // 64px default
        // Spacing unit and scale (for calculations)
        unit: 'var(--spacing-unit, 0.5rem)', // 8px default
        // Extended spacing scale for consistent layouts (keep for backward compatibility)
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        // Use theme border radius if available, otherwise use default
        DEFAULT: 'var(--border-radius, 0.5rem)',
        // Consistent border radius scale
        '4xl': '2rem',
        '5xl': '2.5rem',
        // UI Revamp - Border radius pour cards (16px)
        card: '16px',
        'card-lg': '20px',
      },
      backdropBlur: {
        // UI Revamp - Backdrop blur pour glassmorphism
        glass: '12px',
        'glass-lg': '16px',
      },
      fontFamily: {
        // Use theme font family if available, otherwise fallback to system fonts
        sans: [
          'var(--font-family)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Oxygen',
          'Ubuntu',
          'Cantarell',
          'Fira Sans',
          'Droid Sans',
          'Helvetica Neue',
          'sans-serif',
        ],
        heading: [
          'var(--font-family-heading)',
          'var(--font-family)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        subheading: [
          'var(--font-family-subheading)',
          'var(--font-family)',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        // Standardized typography hierarchy (UX/UI improvements - Batch 2)
        // Fixed pixel values with line heights and font weights
        display: ['48px', { lineHeight: '56px', fontWeight: '700' }], // Very large titles
        h1: ['32px', { lineHeight: '40px', fontWeight: '700' }], // Main title
        h2: ['24px', { lineHeight: '32px', fontWeight: '600' }], // Secondary title
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }], // Tertiary title
        subtitle: ['16px', { lineHeight: '24px', fontWeight: '500' }], // Subtitle
        body: ['14px', { lineHeight: '22px', fontWeight: '400' }], // Body text
        small: ['12px', { lineHeight: '18px', fontWeight: '400' }], // Small text
        caption: ['11px', { lineHeight: '16px', fontWeight: '400' }], // Caption/legend
        // Swiss Style typography - Inter Bold 900 for headings
        'swiss-display': ['72px', { lineHeight: '80px', fontWeight: '900' }], // Hero headline
        'swiss-h1': ['48px', { lineHeight: '56px', fontWeight: '900' }], // Swiss h1
        'swiss-h2': ['36px', { lineHeight: '44px', fontWeight: '600' }], // Swiss h2
        'swiss-h3': ['28px', { lineHeight: '36px', fontWeight: '600' }], // Swiss h3
        'swiss-body': ['18px', { lineHeight: '28px', fontWeight: '400' }], // Swiss body
        'swiss-cta': ['20px', { lineHeight: '28px', fontWeight: '700' }], // CTA text
      },
      boxShadow: {
        // Custom shadows for depth (legacy - kept for backward compatibility)
        soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        medium: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        strong: '0 10px 40px -10px rgba(0, 0, 0, 0.2)',
        
        // UI Revamp - Nouveau système d'ombres multi-niveaux
        // Ombres subtiles (pour éléments légers)
        'subtle-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'subtle-md': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'subtle-lg': '0 4px 8px 0 rgba(0, 0, 0, 0.08)',
        
        // Ombres standard (pour cards) - Utiliser celles-ci par défaut
        'standard-sm': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'standard-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'standard-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.08)',
        'standard-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.06)',
        
        // Ombres colorées (pour éléments interactifs)
        'colored-primary': '0 4px 14px 0 rgba(37, 99, 235, 0.15)',
        'colored-secondary': '0 4px 14px 0 rgba(99, 102, 241, 0.15)',
        'colored-success': '0 4px 14px 0 rgba(4, 120, 87, 0.15)',
        'colored-warning': '0 4px 14px 0 rgba(180, 83, 9, 0.15)',
        'colored-error': '0 4px 14px 0 rgba(220, 38, 38, 0.15)',
        
        // Ombres hover (pour états hover)
        'hover-sm': '0 8px 16px -4px rgba(0, 0, 0, 0.12)',
        'hover-md': '0 12px 24px -6px rgba(0, 0, 0, 0.15)',
        'hover-lg': '0 16px 32px -8px rgba(0, 0, 0, 0.18)',
        
        // Ombres glassmorphism
        'glass-sm': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-md': '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.25)',
        
        // Ombres internes (pour effets de profondeur)
        'inner-sm': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-md': 'inset 0 2px 8px 0 rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        // Theme-aware transition durations
        fast: 'var(--animation-duration-fast, 150ms)',
        normal: 'var(--animation-duration-normal, 200ms)',
        slow: 'var(--animation-duration-slow, 300ms)',
        // Keep default Tailwind durations
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },
      transitionTimingFunction: {
        // Theme-aware easing functions
        default: 'var(--animation-easing-default, ease-in-out)',
        bounce: 'var(--animation-easing-bounce, cubic-bezier(0.68, -0.55, 0.265, 1.55))',
        smooth: 'var(--animation-easing-smooth, cubic-bezier(0.4, 0, 0.2, 1))',
        // Keep default Tailwind easings
        linear: 'linear',
        in: 'cubic-bezier(0.4, 0, 1, 1)',
        out: 'cubic-bezier(0, 0, 0.2, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        // Custom animations with theme-aware durations and easings
        'fade-in': `fadeIn var(--animation-duration-normal, 0.2s) var(--animation-easing-default, ease-in-out)`,
        'slide-up': `slideUp var(--animation-duration-normal, 0.3s) var(--animation-easing-smooth, ease-out)`,
        'slide-down': `slideDown var(--animation-duration-normal, 0.3s) var(--animation-easing-smooth, ease-out)`,
        'scale-in': `scaleIn var(--animation-duration-fast, 0.2s) var(--animation-easing-smooth, ease-out)`,
        'fade-in-slide-up': `fadeInSlideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)`,
        // Optimized blob animation - slower and smoother for better performance
        blob: 'blob 20s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeInSlideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '25%': { transform: 'translate(20px, -50px) scale(1.1)' },
          '50%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '75%': { transform: 'translate(50px, 50px) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
