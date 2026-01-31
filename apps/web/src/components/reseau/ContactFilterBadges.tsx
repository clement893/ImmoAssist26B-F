'use client';
import { Badge } from '@/components/ui';
import { X } from 'lucide-react';
interface ContactFilterBadgesProps {
  filters: {
    city?: string[];
    phone?: string[];
    circle?: string[];
    company?: string[];
    search?: string;
  };
  onRemoveFilter: (key: string, value?: string) => void;
  onClearAll: () => void;
}
export default function ContactFilterBadges({
  filters,
  onRemoveFilter,
  onClearAll,
}: ContactFilterBadgesProps) {
  const hasFilters =
    (filters.city && filters.city.length > 0) ||
    (filters.phone && filters.phone.length > 0) ||
    (filters.circle && filters.circle.length > 0) ||
    (filters.company && filters.company.length > 0) ||
    (filters.search && filters.search.length > 0);
  if (!hasFilters) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      {' '}
      {filters.city?.map((city) => (
        <Badge key={city} className="flex items-center gap-1 bg-muted">
          {' '}
          Ville: {city}{' '}
          <button
            onClick={() => onRemoveFilter('city', city)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Retirer le filtre ville ${city}`}
          >
            {' '}
            <X className="w-3 h-3" />{' '}
          </button>{' '}
        </Badge>
      ))}{' '}
      {filters.phone?.map((phone) => (
        <Badge key={phone} className="flex items-center gap-1 bg-muted">
          {' '}
          Téléphone: {phone}{' '}
          <button
            onClick={() => onRemoveFilter('phone', phone)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Retirer le filtre téléphone ${phone}`}
          >
            {' '}
            <X className="w-3 h-3" />{' '}
          </button>{' '}
        </Badge>
      ))}{' '}
      {filters.circle?.map((circle) => (
        <Badge key={circle} className="flex items-center gap-1 bg-muted">
          {' '}
          Cercle: {circle}{' '}
          <button
            onClick={() => onRemoveFilter('circle', circle)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Retirer le filtre cercle ${circle}`}
          >
            {' '}
            <X className="w-3 h-3" />{' '}
          </button>{' '}
        </Badge>
      ))}{' '}
      {filters.company?.map((company) => (
        <Badge key={company} className="flex items-center gap-1 bg-muted">
          {' '}
          Entreprise: {company}{' '}
          <button
            onClick={() => onRemoveFilter('company', company)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            aria-label={`Retirer le filtre entreprise ${company}`}
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
