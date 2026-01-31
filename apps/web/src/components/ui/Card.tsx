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
      return 'p-lg'; // Default padding: 24px (UX/UI improvements - Batch 5)
    }

    // Use theme padding (sm, md, lg)
    const paddingSize = 'md'; // Default to md
    const paddingValue = cardPaddingConfig[paddingSize] || cardPaddingConfig.md || '1.5rem';
    return paddingValue;
  };

  const cardPadding = getCardPadding();
  const useThemePadding = typeof cardPadding === 'string' && cardPadding !== 'p-lg';

  return (
    <div
      className={clsx(
        'rounded-xl border',
        // Modern shadow system
        'shadow-sm',
        'bg-[var(--color-background)]',
        'border-[var(--color-border)]',
        'backdrop-blur-sm',
        // Enhanced hover effects
        hover && 'transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-400/50 focus:ring-offset-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5',
        className
      )}
      style={
        {
          // Glassmorphism support: use CSS variables with fallbacks
          backgroundColor: 'var(--glassmorphism-card-background, var(--color-background))',
          backdropFilter: 'var(--glassmorphism-card-backdrop-blur, var(--glassmorphism-backdrop, blur(8px)))',
          WebkitBackdropFilter: 'var(--glassmorphism-card-backdrop-blur, var(--glassmorphism-backdrop, blur(8px)))',
          borderColor: 'var(--glassmorphism-card-border, var(--color-border))',
          // Enhanced shadow for glassmorphism with modern layered shadows
          boxShadow: hover || onClick
            ? 'var(--glassmorphism-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05))'
            : 'var(--glassmorphism-shadow, 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06))',
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
          className={clsx('border-b border-[var(--color-border)]', !useThemePadding && 'px-lg py-md')}
          style={
            useThemePadding
              ? {
                  paddingLeft: cardPadding,
                  paddingRight: cardPadding,
                  paddingTop: cardPadding,
                  paddingBottom: cardPadding,
                }
              : undefined
          }
        >
          {header || (
            <>
              {title && <h3 className="text-lg font-semibold text-[var(--color-foreground)]">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{subtitle}</p>}
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
          className={clsx('border-t border-[var(--color-border)]/50 bg-[var(--color-muted)]/50 backdrop-blur-sm', !useThemePadding && 'px-lg py-md')}
          style={
            useThemePadding
              ? {
                  paddingLeft: cardPadding,
                  paddingRight: cardPadding,
                  paddingTop: cardPadding,
                  paddingBottom: cardPadding,
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
