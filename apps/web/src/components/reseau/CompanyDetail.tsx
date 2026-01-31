'use client';
import { type Company } from '@/lib/api/companies';
import { Card, Button } from '@/components/ui';
import CompanyAvatar from './CompanyAvatar';
import { Edit, Trash2 } from 'lucide-react';
interface CompanyDetailProps {
  company: Company;
  onEdit?: () => void;
  onDelete?: () => void;
}
export default function CompanyDetail({ company, onEdit, onDelete }: CompanyDetailProps) {
  return (
    <Card className="p-6">
      {' '}
      <div className="flex items-start gap-4">
        {' '}
        <CompanyAvatar company={company} size="lg" />{' '}
        <div className="flex-1">
          {' '}
          <h3 className="text-xl font-semibold mb-2">{company.name}</h3>{' '}
          {company.description && (
            <p className="text-muted-foreground mb-4">{company.description}</p>
          )}{' '}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {' '}
            {company.website && (
              <div>
                {' '}
                <span className="font-medium">Site web:</span> {company.website}{' '}
              </div>
            )}{' '}
            {company.email && (
              <div>
                {' '}
                <span className="font-medium">Email:</span> {company.email}{' '}
              </div>
            )}{' '}
            {company.phone && (
              <div>
                {' '}
                <span className="font-medium">Téléphone:</span> {company.phone}{' '}
              </div>
            )}{' '}
            {company.country && (
              <div>
                {' '}
                <span className="font-medium">Pays:</span> {company.country}{' '}
              </div>
            )}{' '}
          </div>{' '}
          {(onEdit || onDelete) && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              {' '}
              {onEdit && (
                <Button variant="outline" onClick={onEdit}>
                  {' '}
                  <Edit className="w-4 h-4 mr-2" /> Modifier{' '}
                </Button>
              )}{' '}
              {onDelete && (
                <Button variant="danger" onClick={onDelete}>
                  {' '}
                  <Trash2 className="w-4 h-4 mr-2" /> Supprimer{' '}
                </Button>
              )}{' '}
            </div>
          )}{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
