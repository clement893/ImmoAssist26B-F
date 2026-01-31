/** * Table Pagination Component * Reusable pagination display for tables */ 'use client';
import Pagination from './Pagination';
export interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}
export default function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: TablePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);
  return (
    <div className={clsx('flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800/30 border-t border-neutral-200 dark:border-neutral-700 rounded-b-xl', className)}>
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Affichage de {startIndex} à {endIndex} sur {totalItems}
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
