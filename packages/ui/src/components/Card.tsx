'use client';

import { type ReactNode, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';

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
  // Use actions as footer if footer is not provided
  const cardFooter = footer || actions;

  // Generate aria-label for clickable cards without title
  const ariaLabel = onClick && !title ? 'Clickable card' : undefined;

  return (
    <div
      className={clsx(
        'rounded-lg border shadow-sm',
        'bg-background',
        'border-border',
        hover && 'transition-all hover:shadow-md',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2',
        className
      )}
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
        <div className="border-b border-border px-6 py-4">
          {header || (
            <>
              {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
              {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            </>
          )}
        </div>
      )}

      <div className={clsx(padding && 'p-6')}>
        {children}
      </div>

      {cardFooter && (
        <div className="border-t border-border bg-muted px-6 py-4">
          {cardFooter}
        </div>
      )}
    </div>
  );
}
