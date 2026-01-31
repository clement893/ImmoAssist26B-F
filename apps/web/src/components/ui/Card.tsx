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

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'gradient';

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
  /** Enable hover effect */
  hover?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Add padding to card content */
  padding?: boolean;
}

export default function Card({
  children,
  title,
  subtitle,
  header,
  footer,
  actions,
  className,
  variant = 'default',
  hover = false,
  onClick,
  padding = true,
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

  // Get card padding - use theme config if available, otherwise use defaults
  const getCardPadding = () => {
    if (!cardPaddingConfig) {
      return 'p-6'; // Default padding: 24px (modern spacing)
    }

    // Use theme padding (sm, md, lg)
    const paddingSize = 'md'; // Default to md
    const paddingValue = cardPaddingConfig[paddingSize] || cardPaddingConfig.md || '1.5rem';
    return paddingValue;
  };

  const cardPadding = getCardPadding();
  const useThemePadding = typeof cardPadding === 'string' && cardPadding !== 'p-6';

  // Variant styles
  const variantStyles = {
    default: 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm',
    elevated: 'bg-white dark:bg-neutral-900 border-0 shadow-md hover:shadow-lg',
    outlined: 'bg-transparent border-2 border-neutral-300 dark:border-neutral-700 shadow-none',
    gradient: 'bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950 border border-primary-200 dark:border-primary-800 shadow-sm',
  };

  return (
    <div
      className={clsx(
        'rounded-xl', // Modern rounded corners (12px)
        variantStyles[variant],
        'backdrop-blur-sm',
        'transition-all duration-200 ease-out',
        // Enhanced hover effects
        (hover || onClick) && 'hover:shadow-lg hover:-translate-y-1',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2',
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
      {(title || subtitle || header) && (
        <div
          className={clsx('border-b border-neutral-200 dark:border-neutral-800', !useThemePadding && 'px-6 py-4')}
          style={
            useThemePadding
              ? {
                  paddingLeft: cardPadding,
                  paddingRight: cardPadding,
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
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

      {cardFooter && (
        <div
          className={clsx('border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50', !useThemePadding && 'px-6 py-4')}
          style={
            useThemePadding
              ? {
                  paddingLeft: cardPadding,
                  paddingRight: cardPadding,
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
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
