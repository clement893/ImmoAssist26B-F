import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface TableProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Table({ children, className, style }: TableProps) {
  return (
    <div className="overflow-x-auto -mx-1 px-1" style={style}>
      <table className={clsx('min-w-full divide-y divide-border', className)}>{children}</table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function TableHead({ children, className, style }: TableHeadProps) {
  return (
    <thead className={clsx('bg-neutral-50 dark:bg-neutral-800/50 border-b-2 border-neutral-200 dark:border-neutral-700', className)} style={style}> {/* Revamp UI - Border épaisseur augmentée */}
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}

export function TableBody({
  children,
  className,
  striped = false,
  hover = false,
  style,
}: TableBodyProps) {
  return (
    <tbody
      className={clsx(
        'bg-white dark:bg-neutral-900 divide-y divide-gray-100 dark:divide-neutral-800', // UI Revamp - Style démo pages (border-gray-100)
        striped && '[&>tr:nth-child(even)]:bg-gray-50 dark:[&>tr:nth-child(even)]:bg-neutral-900/50',
        hover && '[&>tr:hover]:bg-gray-50 dark:[&>tr:hover]:bg-neutral-800/50 [&>tr:hover]:transition-all [&>tr:hover]:duration-200', // UI Revamp - Style démo pages
        className
      )}
      style={style}
    >
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function TableRow({ children, className, onClick, style }: TableRowProps) {
  return (
    <tr 
      className={clsx(
        'transition-modern', // UI Revamp - Transition moderne
        onClick && 'cursor-pointer',
        className
      )} 
      onClick={onClick} 
      style={style}
    >
      {children}
    </tr>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
  style?: React.CSSProperties;
}

export function TableHeader({
  children,
  className,
  sortable = false,
  sortDirection,
  onSort,
  style,
}: TableHeaderProps) {
  return (
    <th
      className={clsx(
        'px-6 py-4 text-left text-sm font-normal text-gray-900 dark:text-neutral-100', // UI Revamp - Style démo pages (font-normal au lieu de semibold)
        sortable && 'cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200', // UI Revamp - Transition moderne
        className
      )}
      onClick={sortable ? onSort : undefined}
      style={style}
    >
      <div className="flex items-center gap-2">
        <span>{children}</span>
        {sortable && (
          <div className="flex flex-col -space-y-1">
            <svg
              className={clsx(
                'w-3 h-3 transition-modern', // UI Revamp - Transition moderne
                sortDirection === 'asc'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
            <svg
              className={clsx(
                'w-3 h-3 transition-modern', // UI Revamp - Transition moderne
                sortDirection === 'desc'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-neutral-400 dark:text-neutral-500'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  colSpan?: number;
  onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void;
  style?: React.CSSProperties;
}

export function TableCell({ children, className, colSpan, onClick, style }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      onClick={onClick}
      className={clsx(
        'px-6 py-4 whitespace-nowrap text-sm font-light text-gray-600 dark:text-neutral-400', // UI Revamp - Style démo pages (font-light)
        className
      )}
      style={style}
    >
      {children}
    </td>
  );
}
