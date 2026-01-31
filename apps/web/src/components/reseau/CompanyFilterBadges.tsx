'use client';
import { Badge } from '@/components/ui';
import { X } from 'lucide-react';
interface CompanyFilterBadgesProps {
  filters: { country?: string[]; is_client?: string[]; search?: string };
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}
export default function CompanyFilterBadges({
  filters,
  onRemoveFilter,
  onClearAll,
}: CompanyFilterBadgesProps) {
  const hasFilters =
    (filters.country && filters.country.length > 0) ||
    (filters.is_client && filters.is_client.length > 0) ||
    (filters.search && filters.search.length > 0);
  if (!hasFilters) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {' '}
      {filters.country?.map((country) => (
        <Badge key={country} className="flex items-center gap-1 bg-muted">
          {' '}
          Pays: {country}{' '}
          <button
            onClick={() => onRemoveFilter('country', country)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Retirer le filtre pays ${country}`}
          >
            {' '}
            <X className="w-3 h-3" />{' '}
          </button>{' '}
        </Badge>
      ))}{' '}
      {filters.is_client?.map((client) => (
        <Badge key={client} className="flex items-center gap-1 bg-muted">
          {' '}
          Client: {client === 'yes' ? 'Oui' : 'Non'}{' '}
          <button
            onClick={() => onRemoveFilter('is_client', client)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Retirer le filtre client ${client}`}
          >
            {' '}
            <X className="w-3 h-3" />{' '}
          </button>{' '}
        </Badge>
      ))}{' '}
      {filters.search && (
        <Badge className="flex items-center gap-1 bg-muted">
          {' '}
          Recherche: {filters.search}{' '}
          <button
            onClick={() => onRemoveFilter('search')}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label="Retirer le filtre de recherche"
          >
            {' '}
            <X className="w-3 h-3" />{' '}
          </button>{' '}
        </Badge>
      )}{' '}
      <button
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-foreground underline"
      >
        {' '}
        Tout effacer{' '}
      </button>{' '}
    </div>
  );
}
