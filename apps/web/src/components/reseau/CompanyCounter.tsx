'use client';
import { Badge } from '@/components/ui';
interface CompanyCounterProps {
  filtered: number;
  total: number;
  showFilteredBadge?: boolean;
}
export default function CompanyCounter({
  filtered,
  total,
  showFilteredBadge = false,
}: CompanyCounterProps) {
  return (
    <div className="flex items-center gap-2">
      {' '}
      <span className="text-sm font-medium text-foreground">
        {' '}
        {filtered} entreprise{filtered !== 1 ? 's' : ''}{' '}
      </span>{' '}
      {showFilteredBadge && filtered !== total && (
        <Badge className="text-xs border border-border"> Filtré sur {total} </Badge>
      )}{' '}
    </div>
  );
}
