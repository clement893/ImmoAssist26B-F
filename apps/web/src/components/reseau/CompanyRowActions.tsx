'use client';
import { type Company } from '@/lib/api/companies';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
interface CompanyRowActionsProps {
  company: Company;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
export default function CompanyRowActions({
  company,
  onView,
  onEdit,
  onDelete,
}: CompanyRowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {' '}
      <Button
        size="sm"
        variant="ghost"
        onClick={onView}
        className="h-8 w-8 p-0"
        aria-label={`Voir ${company.name}`}
      >
        {' '}
        <Eye className="w-4 h-4" />{' '}
      </Button>{' '}
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-8 w-8 p-0"
        aria-label={`Modifier ${company.name}`}
      >
        {' '}
        <Edit className="w-4 h-4" />{' '}
      </Button>{' '}
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        aria-label={`Supprimer ${company.name}`}
      >
        {' '}
        <Trash2 className="w-4 h-4" />{' '}
      </Button>{' '}
    </div>
  );
}
