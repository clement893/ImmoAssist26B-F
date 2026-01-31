'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Home, Users, Calendar, DollarSign } from 'lucide-react';

interface TransactionSummaryCardProps {
  transaction: {
    name: string;
    status: string;
    dossier_number?: string;
    property_address?: string;
    property_city?: string;
    bedrooms?: number;
    bathrooms?: number;
    sellers?: Array<{ name: string }>;
    buyers?: Array<{ name: string }>;
    final_sale_price?: number;
    expected_closing_date?: string;
  };
}

export default function TransactionSummaryCard({ transaction }: TransactionSummaryCardProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'En cours': 'default',
      'Conditionnelle': 'warning',
      'Ferme': 'success',
      'Annulée': 'error',
      'Conclue': 'success',
    };
    return colors[status] || 'default';
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 border-blue-200 dark:border-slate-700">
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
              {transaction.name}
            </h2>
            {transaction.dossier_number && (
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Dossier: {transaction.dossier_number}
              </p>
            )}
          </div>
          <Badge variant={getStatusColor(transaction.status) as any} className="text-xs px-2 py-1">
            {transaction.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Propriété */}
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Propriété</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {transaction.property_address 
                  ? `${transaction.property_city || ''}${transaction.property_city ? ', ' : ''}${transaction.property_address}`
                  : '-'}
              </p>
              {(transaction.bedrooms || transaction.bathrooms) && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {transaction.bedrooms || 0} ch. / {transaction.bathrooms || 0} s.b.
                </p>
              )}
            </div>
          </div>

          {/* Parties */}
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Parties</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {((transaction.sellers?.length || 0) + (transaction.buyers?.length || 0)) || '-'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {transaction.sellers?.length || 0} vendeur{transaction.sellers?.length !== 1 ? 's' : ''} / {transaction.buyers?.length || 0} acheteur{transaction.buyers?.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Prix */}
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Prix de vente</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatCurrency(transaction.final_sale_price)}
              </p>
            </div>
          </div>

          {/* Date de clôture */}
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Clôture prévue</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {formatDate(transaction.expected_closing_date)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
