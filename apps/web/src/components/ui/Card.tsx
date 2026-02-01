/**
 * Card Component
 *
 * Versatile card component for displaying content with optional header, footer, and actions.
 * Supports hover effects, click handlers, and dark mode.
 *
 * @component
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <p>Card content</p>
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * // Card with title and subtitle
 * <Card title="Card Title" subtitle="Subtitle">
 *   <p>Card content</p>
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * // Card with actions in footer
 * <Card
 *   title="Card Title"
 *   footer={<Button>Action</Button>}
 * >
 *   <p>Card content</p>
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * // Clickable card with hover effect
 * <Card
 *   title="Clickable Card"
 *   hover
 *   onClick={() => logger.log('Card clicked')}
 * >
 *   <p>Click me!</p>
 * </Card>
 * ```
 *
 * @example
 * ```tsx
 * // Card with custom header
 * <Card
 *   header={
 *     <div className="flex items-center justify-between">
 *       <h3>Custom Header</h3>
 *       <Badge>New</Badge>
 *     </div>
 *   }
 * >
 *   <p>Content with custom header</p>
 * </Card>
 * ```
 *
 * @param {CardProps} props - Component props
 * @param {ReactNode} props.children - Card content (required)
 * @param {string} [props.title] - Card title displayed in header
 * @param {string} [props.subtitle] - Card subtitle displayed below title
 * @param {ReactNode} [props.header] - Custom header content (overrides title/subtitle)
 * @param {ReactNode} [props.footer] - Footer content (buttons, actions, etc.)
 * @param {ReactNode} [props.actions] - Alias for footer prop
 * @param {boolean} [props.hover=false] - Enable hover shadow effect
 * @param {() => void} [props.onClick] - Click handler (makes card clickable)
 * @param {boolean} [props.padding=true] - Add padding to card content
 * @param {string} [props.className] - Additional CSS classes
 *
 * @returns {JSX.Element} Card component
 *
 * @see {@link https://tailwindcss.com/docs/box-shadow} Tailwind shadow utilities
 */
'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';

export type CardVariant = 'default' | 'elevated' | 'floating' | 'outlined' | 'gradient' | 'glass' | 'bordered' | 'image' | 'minimal';
export type CardElevation = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type CardHoverEffect = 'lift' | 'glow' | 'scale' | 'none';
export type AccentBorderPosition = 'left' | 'top' | 'right' | 'bottom' | 'none';

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick'> {
  /** Card content */
  children: ReactNode;
  /** Card title */
  title?: string;
  /** Card subtitle */
  subtitle?: string;
  /** Custom header content */
  header?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Actions (alias for footer) */
  actions?: ReactNode;
  /** Card variant style */
  variant?: CardVariant;
  /** Elevation level */
  elevation?: CardElevation;
  /** Enable hover effect */
  hover?: boolean;
  /** Hover effect type */
  hoverEffect?: CardHoverEffect;
  /** Click handler */
  onClick?: () => void;
  /** Add padding to card content */
  padding?: boolean;
  /** Accent border position */
  accentBorder?: AccentBorderPosition;
  /** Accent border color */
  accentColor?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | string;
  /** Image header URL (for image variant) */
  imageHeader?: string;
  /** Glass intensity (for glass variant) */
  glassIntensity?: 'light' | 'medium' | 'strong';
  /** Left border color (deprecated - use accentBorder and accentColor) */
  leftBorder?: 'primary' | 'secondary' | 'purple' | 'teal' | 'orange' | 'pink' | 'cyan' | 'success' | 'warning' | 'error';
}

export default function Card({
  children,
  title,
  subtitle,
  header,
  footer,
  actions,
  className,
  variant = 'elevated',
  elevation = 'md',
  hover = false,
  hoverEffect = 'lift',
  onClick,
  padding = true,
  accentBorder = 'none',
  accentColor = 'primary',
  imageHeader,
  glassIntensity = 'medium',
  leftBorder, // Deprecated but kept for backward compatibility
  ...props
}: CardProps) {
  const { theme } = useGlobalTheme();

  // Get card padding from theme config (card uses padding object, not sizes)
  const cardConfig = theme?.config?.components?.card;
  const cardPaddingConfig = cardConfig?.padding;

  // Use actions as footer if footer is not provided
  const cardFooter = footer || actions;

  // Generate aria-label for clickable cards without title
  const ariaLabel = onClick && !title ? 'Clickable card' : undefined;

  // Get card padding - use theme config if available, otherwise use defaults (Revamp UI - Padding augmenté pour style démo)
  const getCardPadding = () => {
    if (!cardPaddingConfig) {
      return 'p-8'; // Default padding: 32px - Style démo pages (ultra-minimaliste)
    }

    // Use theme padding (sm, md, lg)
    const paddingSize = 'md'; // Default to md
    const paddingValue = cardPaddingConfig[paddingSize] || cardPaddingConfig.md || '1.5rem';
    return paddingValue;
  };

  const cardPadding = getCardPadding();
  const useThemePadding = typeof cardPadding === 'string' && cardPadding !== 'p-6';

  // Variant styles - Dashboard V2 Style - rounded-3xl (24px) pour cards principales
  const variantStyles: Record<CardVariant, string> = {
    default: 'bg-white dark:bg-neutral-900 border-0 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200',
    elevated: 'bg-white dark:bg-neutral-900 border-0 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200',
    floating: 'bg-white dark:bg-neutral-900 border-0 rounded-3xl shadow-md',
    outlined: 'bg-transparent border-2 border-neutral-300 dark:border-neutral-700 rounded-3xl shadow-none',
    gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 border border-primary-200 dark:border-primary-800 rounded-3xl shadow-standard-md',
    glass: 'bg-white/70 dark:bg-neutral-900/70 backdrop-blur-glass border border-white/30 dark:border-neutral-800/50 rounded-3xl shadow-glass-md',
    bordered: 'bg-white dark:bg-neutral-900 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200',
    image: 'bg-white dark:bg-neutral-900 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden',
    minimal: 'bg-transparent border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-none',
  };

  // Glass intensity mapping
  const glassBgOpacity = {
    light: 'bg-white/50 dark:bg-neutral-900/50',
    medium: 'bg-white/70 dark:bg-neutral-900/70',
    strong: 'bg-white/90 dark:bg-neutral-900/90',
  }[glassIntensity];

  // Hover effect styles
  const hoverEffectStyles: Record<CardHoverEffect, string> = {
    lift: 'hover:shadow-standard-lg hover:-translate-y-0.5',
    glow: 'hover:shadow-colored-primary',
    scale: 'hover:scale-[1.02]',
    none: '',
  };

  // Accent colors mapping
  const accentColorMap: Record<string, string> = {
    primary: 'primary-500',
    secondary: 'secondary-500',
    success: 'success-500',
    warning: 'warning-500',
    error: 'error-500',
  };

  // Determine accent border color
  const accentColorClass = accentColorMap[accentColor] || accentColor;
  
  // Build accent border class
  let accentBorderClass = '';
  if (accentBorder !== 'none') {
    const borderSide = accentBorder.charAt(0); // 'l', 't', 'r', 'b'
    const borderClass = `border-${borderSide}-4 border-${borderSide}-${accentColorClass}`;
    accentBorderClass = borderClass;
  }

  // Left border color mapping (backward compatibility)
  const leftBorderColors: Record<string, string> = {
    primary: 'border-l-4 border-l-primary-500',
    secondary: 'border-l-4 border-l-secondary-500',
    purple: 'border-l-4 border-l-[#a855f7]',
    teal: 'border-l-4 border-l-[#14b8a6]',
    orange: 'border-l-4 border-l-[#fb923c]',
    pink: 'border-l-4 border-l-[#f472b6]',
    cyan: 'border-l-4 border-l-[#06b6d4]',
    success: 'border-l-4 border-l-success-500',
    warning: 'border-l-4 border-l-warning-500',
    error: 'border-l-4 border-l-error-500',
  };

  // Determine final accent border class (backward compatibility with leftBorder)
  const finalAccentBorderClass = leftBorder 
    ? leftBorderColors[leftBorder] 
    : accentBorderClass;

  // Determine hover class
  const hoverClass = (hover || onClick) && hoverEffect !== 'none'
    ? hoverEffectStyles[hoverEffect]
    : '';

  // Apply glass style if needed
  const glassStyle = variant === 'glass' ? glassBgOpacity : '';

  return (
    <div
      className={clsx(
        // Base styles - Dashboard V2 Style - rounded-3xl (24px) par défaut dans variantStyles
        variantStyles[variant],
        glassStyle,
        finalAccentBorderClass,
        'transition-modern',
        hoverClass,
        // Interactive states
        onClick && 'active:scale-[0.98] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
        'w-full',
        className
      )}
      style={
        {
          // Modern card styling with CSS variables
          backgroundColor: variant === 'gradient' ? undefined : 'var(--color-background, #ffffff)',
        } as React.CSSProperties
      }
      onClick={
        onClick
          ? (e: React.MouseEvent<HTMLDivElement>) => {
              // Only trigger card onClick if the click target is the card itself or a non-interactive element
              const target = e.target as HTMLElement;
              const isInteractive =
                target.tagName === 'BUTTON' ||
                target.tagName === 'A' ||
                target.closest('button') !== null ||
                target.closest('a') !== null;

              if (!isInteractive) {
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={
        onClick
          ? (e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      {...props}
    >
      {/* Image Header (for image variant) */}
      {imageHeader && variant === 'image' && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={imageHeader} 
            alt={title || 'Card header'} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          {(title || subtitle) && (
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {title && <h3 className="text-xl font-semibold">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm opacity-90">{subtitle}</p>}
            </div>
          )}
        </div>
      )}

      {/* Header (if not image variant or no image header) */}
      {!imageHeader && (title || subtitle || header) && (
        <div
          className={clsx('border-b border-neutral-200 dark:border-neutral-800', !useThemePadding && 'px-4 py-3')}
          style={
            useThemePadding
              ? {
                  paddingLeft: cardPadding,
                  paddingRight: cardPadding,
                  paddingTop: '0.75rem', // Reduced from 1rem (-25%)
                  paddingBottom: '0.75rem', // Reduced from 1rem (-25%)
                }
              : undefined
          }
        >
          {header || (
            <>
              {title && <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{subtitle}</p>}
            </>
          )}
        </div>
      )}

      {/* Content (skip if image variant with image header and title/subtitle) */}
      {!(imageHeader && variant === 'image' && (title || subtitle)) && (
        <div
          className={clsx(padding && !useThemePadding && cardPadding)}
          style={
            padding && useThemePadding
              ? {
                  padding: cardPadding,
                }
              : undefined
          }
        >
          {children}
        </div>
      )}
      
      {/* Content for image variant when image header is present */}
      {imageHeader && variant === 'image' && (title || subtitle) && (
        <div
          className={clsx(padding && !useThemePadding && cardPadding)}
          style={
            padding && useThemePadding
              ? {
                  padding: cardPadding,
                }
              : undefined
          }
        >
          {children}
        </div>
      )}

      {cardFooter && (
        <div
          className={clsx('border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50', !useThemePadding && 'px-4 py-3')}
          style={
            useThemePadding
              ? {
                  paddingLeft: cardPadding,
                  paddingRight: cardPadding,
                  paddingTop: '0.75rem', // Reduced from 1rem (-25%)
                  paddingBottom: '0.75rem', // Reduced from 1rem (-25%)
                }
              : undefined
          }
        >
          {cardFooter}
        </div>
      )}
    </div>
  );
}
