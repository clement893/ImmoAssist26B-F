/** * Table Search Bar Component * Reusable search input for tables */ 'use client';
import Input from './Input';
export interface TableSearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  className?: string;
}
export default function TableSearchBar({
  searchTerm,
  onSearchChange,
  placeholder = 'Rechercher...',
  className,
}: TableSearchBarProps) {
  return (
    <div className={className}>
      {' '}
      <Input
        placeholder={placeholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {' '}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />{' '}
          </svg>
        }
      />{' '}
    </div>
  );
}
