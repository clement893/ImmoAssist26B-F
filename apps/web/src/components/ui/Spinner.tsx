import { clsx } from 'clsx';
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}
export default function Spinner({ size = 'md', className, color = 'primary' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-12 h-12 border-4' };
  const colors = {
    primary: 'border-primary-600 dark:border-primary-500 border-t-transparent',
    secondary: 'border-muted-foreground border-t-transparent',
    white: 'border-background border-t-transparent',
  };
  return (
    <div
      className={clsx('rounded-full animate-spin', sizes[size], colors[color], className)}
      role="status"
      aria-label="Loading"
    >
      {' '}
      <span className="sr-only">Loading...</span>{' '}
    </div>
  );
}
