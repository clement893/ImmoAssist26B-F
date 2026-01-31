import { clsx } from 'clsx';
interface StatusCardProps {
  title: string;
  description: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}
export default function StatusCard({ title, description, status = 'success' }: StatusCardProps) {
  const statusClasses = {
    success:
      'border-secondary-200 dark:border-secondary-800 bg-secondary-100 dark:bg-secondary-900',
    error: 'border-error-200 dark:border-error-800 bg-error-100 dark:bg-error-900',
    warning: 'border-warning-200 dark:border-warning-800 bg-warning-100 dark:bg-warning-900',
    info: 'border-primary-200 dark:border-primary-800 bg-primary-100 dark:bg-primary-900',
  };
  const textClasses = {
    success: 'text-secondary-900 dark:text-secondary-100',
    error: 'text-error-900 dark:text-error-100',
    warning: 'text-warning-900 dark:text-warning-100',
    info: 'text-primary-900 dark:text-primary-100',
  };
  const textSecondaryClasses = {
    success: 'text-secondary-800 dark:text-secondary-200',
    error: 'text-error-800 dark:text-error-200',
    warning: 'text-warning-800 dark:text-warning-200',
    info: 'text-primary-800 dark:text-primary-200',
  };
  return (
    <div className={clsx('p-4 border rounded-lg', statusClasses[status])}>
      {' '}
      <p className={clsx('font-semibold', textClasses[status])}>{title}</p>{' '}
      <p className={clsx('text-sm mt-1', textSecondaryClasses[status])}>{description}</p>{' '}
    </div>
  );
}
