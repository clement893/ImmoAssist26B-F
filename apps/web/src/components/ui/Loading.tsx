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
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-4' };
  const spinner = (
    <div
      className={clsx(
        'border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/90 z-50">
        {' '}
        {spinner} {text && <p className="mt-4 text-muted-foreground">{text}</p>}{' '}
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
