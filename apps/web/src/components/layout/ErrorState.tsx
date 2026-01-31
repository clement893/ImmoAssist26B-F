import { EmptyState } from '@/components/ui';
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}
export default function ErrorState({
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données. Veuillez réessayer.',
  onRetry,
}: ErrorStateProps) {
  return (
    <EmptyState
      title={title}
      description={description}
      icon={
        <svg
          className="w-16 h-16 text-error-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {' '}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />{' '}
        </svg>
      }
      action={onRetry ? { label: 'Réessayer', onClick: onRetry } : undefined}
    />
  );
}
