'use client';
import { clsx } from 'clsx';
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showFirstLast?: boolean;
  maxVisible?: number;
}
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
  maxVisible = 5,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const half = Math.floor(maxVisible / 2);
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= half + 1) {
        for (let i = 1; i <= maxVisible - 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - half) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - half + 1; i <= currentPage + half - 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    return pages;
  };
  const pageNumbers = getPageNumbers();
  return (
    <nav
      className={clsx('flex items-center justify-center space-x-1', className)}
      aria-label="Pagination"
    >
      {' '}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={clsx(
            'px-3 py-2 rounded-md text-sm font-medium transition-modern shadow-subtle-sm', // UI Revamp - Transition moderne et ombre subtile
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:shadow-subtle-md',
            currentPage === 1
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-background text-foreground hover:bg-muted hover:shadow-subtle-md'
          )}
          aria-label="First page"
        >
          {' '}
          ««{' '}
        </button>
      )}{' '}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={clsx(
          'px-3 py-2 rounded-md text-sm font-medium transition-modern shadow-subtle-sm', // UI Revamp - Transition moderne et ombre subtile
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:shadow-subtle-md',
          currentPage === 1
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-background text-foreground hover:bg-muted hover:shadow-subtle-md'
        )}
        aria-label="Previous page"
      >
        {' '}
        ‹{' '}
      </button>{' '}
      {pageNumbers.map((page, index) => {
        if (page === 'ellipsis') {
          return (
            <span key={`ellipsis-${index}`} className="px-3 py-2 text-muted-foreground">
              {' '}
              ...{' '}
            </span>
          );
        }
        const pageNum = page as number;
        const isActive = pageNum === currentPage;
        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium transition-modern shadow-subtle-sm', // UI Revamp - Transition moderne et ombre subtile
              'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:shadow-subtle-md',
              isActive
                ? 'bg-primary-600 dark:bg-primary-500 text-background shadow-standard-sm' // UI Revamp - Ombre standard pour page active
                : 'bg-background text-foreground hover:bg-muted hover:shadow-subtle-md'
            )}
            aria-label={`Page ${pageNum}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {' '}
            {pageNum}{' '}
          </button>
        );
      })}{' '}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={clsx(
          'px-3 py-2 rounded-md text-sm font-medium transition-modern shadow-subtle-sm', // UI Revamp - Transition moderne et ombre subtile
          'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:shadow-subtle-md',
          currentPage === totalPages
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-background text-foreground hover:bg-muted hover:shadow-subtle-md'
        )}
        aria-label="Next page"
      >
        {' '}
        ›{' '}
      </button>{' '}
      {showFirstLast && (
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={clsx(
            'px-3 py-2 rounded-md text-sm font-medium transition-modern shadow-subtle-sm', // UI Revamp - Transition moderne et ombre subtile
            'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:shadow-subtle-md',
            currentPage === totalPages
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-background text-foreground hover:bg-muted hover:shadow-subtle-md'
          )}
          aria-label="Last page"
        >
          {' '}
          »»{' '}
        </button>
      )}{' '}
    </nav>
  );
}
