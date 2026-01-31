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
    <div className={`flex items-center justify-between ${className}`}>
      {' '}
      <div className="text-sm text-muted-foreground">
        {' '}
        Affichage de {startIndex} à {endIndex} sur {totalItems}{' '}
      </div>{' '}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />{' '}
    </div>
  );
}
