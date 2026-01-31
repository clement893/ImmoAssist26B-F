import { clsx } from 'clsx';
import { Size, ColorVariant, BaseComponentProps } from './types';

interface ProgressProps extends BaseComponentProps {
  value: number; // 0-100
  max?: number;
  size?: Size;
  variant?: ColorVariant;
  showLabel?: boolean;
  label?: string;
  className?: string;
}

export default function Progress({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  label,
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const sizes = { sm: 'h-1', md: 'h-2', lg: 'h-4' };
  const variants: Record<ColorVariant, string> = {
    default: 'bg-primary-600 dark:bg-primary-500',
    success: 'bg-success-600 dark:bg-success-500',
    warning: 'bg-warning-600 dark:bg-warning-500',
    error: 'bg-error-600 dark:bg-error-500',
    info: 'bg-info-600 dark:bg-info-500',
  };

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-foreground">{label || 'Progress'}</span>
          {showLabel && (
            <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-muted rounded-full overflow-hidden', sizes[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-300', variants[variant])}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
}
