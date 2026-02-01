import { clsx } from 'clsx';
import { Size } from './types';
interface LoadingProps {
  size?: Size;
  className?: string;
  fullScreen?: boolean;
  text?: string;
}
export default function Loading({
  size = 'md',
  className,
  fullScreen = false,
  text,
}: LoadingProps) {
  const sizes: Record<Size, string> = { 
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2', 
    md: 'w-8 h-8 border-2', 
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };
  const spinner = (
    <div
      className={clsx(
        'border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin transition-modern', // UI Revamp - Transition moderne
        sizes[size],
        className
      )}
    />
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-6">
          <span className="text-primary-600 dark:text-primary-400 font-semibold tracking-widest uppercase text-xs opacity-80">
            ImmoAssist
          </span>
          <div className="relative flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full border-2 border-primary-200 dark:border-primary-800" aria-hidden />
            <div className="w-12 h-12 rounded-full border-2 border-primary-600 dark:border-primary-400 border-t-transparent animate-spin" aria-hidden />
          </div>
          {text && <p className="text-sm font-medium text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center">
      {' '}
      {spinner} {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}{' '}
    </div>
  );
}
