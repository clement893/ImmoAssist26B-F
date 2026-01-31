'use client';

import { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ListItem {
  id: string;
  content: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
  divider?: boolean;
}

interface ListProps extends HTMLAttributes<HTMLUListElement> {
  items: ListItem[];
  variant?: 'default' | 'bordered' | 'divided';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const sizeClasses = {
  sm: 'text-sm py-1.5',
  md: 'text-base py-2',
  lg: 'text-lg py-3',
};

export default function List({
  items,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className,
  ...props
}: ListProps) {
  const variantClasses = {
    default: '',
    bordered: 'border border-border rounded-lg',
    divided: 'divide-y divide-border',
  };

  return (
    <ul
      className={clsx(
        'list-none m-0 p-0',
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      role="list"
      {...props}
    >
      {items.map((item, index) => {
        const isClickable = item.onClick && !item.disabled;
        const Component = isClickable ? 'button' : 'li';

        return (
          <Component
            key={item.id}
            onClick={isClickable ? item.onClick : undefined}
            disabled={item.disabled}
            className={clsx(
              'flex items-center gap-3 px-4',
              sizeClasses[size],
              isClickable && 'cursor-pointer hover:bg-muted transition-colors',
              item.disabled && 'opacity-50 cursor-not-allowed',
              variant === 'bordered' && index > 0 && 'border-t border-border',
              variant === 'divided' && index < items.length - 1 && 'border-b border-border'
            )}
            role={isClickable ? 'button' : 'listitem'}
            tabIndex={isClickable ? 0 : undefined}
          >
            {item.icon && <div className="flex-shrink-0 text-muted-foreground">{item.icon}</div>}
            <div className="flex-1 min-w-0">{item.content}</div>
            {item.action && <div className="flex-shrink-0">{item.action}</div>}
          </Component>
        );
      })}
    </ul>
  );
}
