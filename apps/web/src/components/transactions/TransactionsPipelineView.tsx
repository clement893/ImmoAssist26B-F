'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, Search, Filter, MoreVertical, MapPin, DollarSign, Users, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Transaction {
  id: number;
  name: string;
  dossier_number?: string;
  status: string;
  created_at: string;
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  sellers: Array<{ name: string; [key: string]: any }>;
  buyers: Array<{ name: string; [key: string]: any }>;
  listing_price?: number;
  offered_price?: number;
  final_sale_price?: number;
  expected_closing_date?: string;
  actual_closing_date?: string;
  documents?: Array<{
    id: number;
    url: string;
    filename: string;
    type?: string;
    [key: string]: any;
  }>;
}

interface TransactionsPipelineViewProps {
  transactions: Transaction[];
  isLoading: boolean;
  onStatusChange?: (transactionId: number, newStatus: string) => Promise<void>;
  onAddTransaction?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

// Mapping des statuts aux colonnes du pipeline
const STATUS_COLUMNS = [
  {
    id: 'not_ready',
    title: 'Non prêt',
    status: 'En cours',
    color: '#ef4444',
  },
  {
    id: 'conditional',
    title: 'Conditionnelle',
    status: 'Conditionnelle',
    color: '#f59e0b',
  },
  {
    id: 'firm',
    title: 'Ferme',
    status: 'Ferme',
    color: '#3b82f6',
  },
  {
    id: 'completed',
    title: 'Conclue',
    status: 'Conclue',
    color: '#10b981',
  },
];

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return null;
  }
};

const formatCurrency = (amount?: number) => {
  if (!amount) return null;
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function TransactionsPipelineView({
  transactions,
  isLoading,
  onStatusChange,
  onAddTransaction,
  onTransactionClick,
}: TransactionsPipelineViewProps) {
  const router = useRouter();
  const [draggedTransaction, setDraggedTransaction] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleDragStart = (transactionId: number) => {
    setDraggedTransaction(transactionId);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, columnStatus: string) => {
    e.preventDefault();
    if (draggedTransaction && onStatusChange) {
      await onStatusChange(draggedTransaction, columnStatus);
    }
    setDraggedTransaction(null);
    setDragOverColumn(null);
  };

  // Filtrer les transactions selon la recherche
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      transaction.name.toLowerCase().includes(query) ||
      transaction.dossier_number?.toLowerCase().includes(query) ||
      transaction.property_address?.toLowerCase().includes(query) ||
      transaction.property_city?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Aucune transaction trouvée</p>
        {onAddTransaction && (
          <Button onClick={onAddTransaction}>
            <Plus className="w-4 h-4 mr-2" />
            Créer une transaction
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-light text-gray-900 dark:text-gray-100 mb-2">
              Transactions Board
            </h1>
            <p className="text-sm font-light text-gray-500 dark:text-gray-400">
              Gérez vos transactions immobilières
            </p>
          </div>
          {onAddTransaction && (
            <Button onClick={onAddTransaction} className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="text-sm font-light">Ajouter une transaction</span>
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher des transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 bg-white dark:bg-neutral-900 border-0 rounded-xl shadow-sm text-sm font-light placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-light">Filtrer</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map((column) => {
          const columnTransactions = filteredTransactions.filter(
            (transaction) => transaction.status === column.status
          );

          return (
            <div
              key={column.id}
              className={`flex flex-col flex-shrink-0 ${
                dragOverColumn === column.id ? 'ring-2 ring-primary-500' : ''
              }`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h2 className="text-base font-normal text-gray-900 dark:text-gray-100">
                    {column.title}
                  </h2>
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs font-light rounded-full">
                    {columnTransactions.length}
                  </span>
                </div>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-4 min-h-[200px]">
                {columnTransactions.map((transaction) => {
                  const allParties = [
                    ...(transaction.sellers || []).map((s: any) => s.name),
                    ...(transaction.buyers || []).map((b: any) => b.name),
                  ].filter(Boolean);
                  
                  // Get first photo from documents
                  const firstPhoto = transaction.documents?.find(doc => doc.type === 'photo') || transaction.documents?.[0];

                  return (
                    <div
                      key={transaction.id}
                      draggable={!!onStatusChange}
                      onDragStart={() => handleDragStart(transaction.id)}
                      onClick={() => {
                        if (onTransactionClick) {
                          onTransactionClick(transaction);
                        } else {
                          router.push(`/dashboard/transactions/${transaction.id}`);
                        }
                      }}
                      className={`bg-white dark:bg-neutral-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                        draggedTransaction === transaction.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Photo Header */}
                      {firstPhoto?.url && (
                        <div className="relative w-full h-32 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                          <img
                            src={firstPhoto.url}
                            alt={transaction.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Hide image on error
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        {/* Transaction Title */}
                        <h3 className="text-sm font-normal text-gray-900 dark:text-gray-100 mb-2">
                          {transaction.name}
                        </h3>

                      {/* Dossier Number */}
                      {transaction.dossier_number && (
                        <p className="text-xs font-light text-gray-500 dark:text-gray-400 mb-2">
                          Dossier: {transaction.dossier_number}
                        </p>
                      )}

                      {/* Property Address */}
                      {transaction.property_address && (
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-light text-gray-500 dark:text-gray-400 line-clamp-2">
                            {transaction.property_address}
                            {transaction.property_city && `, ${transaction.property_city}`}
                          </p>
                        </div>
                      )}

                      {/* Property Type */}
                      {transaction.property_type && (
                        <div className="mb-3">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-light">
                            {transaction.property_type}
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      {transaction.final_sale_price && (
                        <div className="flex items-center gap-1 mb-3">
                          <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(transaction.final_sale_price)}
                          </span>
                        </div>
                      )}

                      {/* Closing Date */}
                      {transaction.expected_closing_date && (
                        <div className="flex items-center gap-1 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-xs font-light text-gray-500 dark:text-gray-400">
                            Clôture: {formatDate(transaction.expected_closing_date)}
                          </span>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-neutral-800">
                        {/* Avatars */}
                        {allParties.length > 0 && (
                          <div className="flex -space-x-2">
                            {allParties.slice(0, 3).map((name, index) => (
                              <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-light border-2 border-white dark:border-neutral-900"
                                title={name}
                              >
                                {getInitials(name)}
                              </div>
                            ))}
                            {allParties.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700 flex items-center justify-center text-gray-600 dark:text-gray-400 text-xs font-light border-2 border-white dark:border-neutral-900">
                                +{allParties.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Parties Count */}
                        {allParties.length > 0 && (
                          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-light">{allParties.length}</span>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  );
                })}

                {/* Add Card Button */}
                {onAddTransaction && (
                  <button
                    onClick={onAddTransaction}
                    className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-2xl text-sm font-light text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-neutral-700 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                  >
                    + Ajouter une carte
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
