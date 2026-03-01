'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, Search, Filter, MoreVertical, MapPin, DollarSign, Users, Calendar, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TransactionImage from '@/components/transactions/TransactionImage';

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
  // État local pour les mises à jour optimistes
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>(transactions);
  
  // Synchroniser l'état local avec les transactions reçues en props
  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

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
      // Mise à jour optimiste : mettre à jour immédiatement l'état local
      const transactionToUpdate = localTransactions.find(t => t.id === draggedTransaction);
      if (transactionToUpdate) {
        const updatedTransaction = { ...transactionToUpdate, status: columnStatus };
        setLocalTransactions(prev => 
          prev.map(t => t.id === draggedTransaction ? updatedTransaction : t)
        );
      }
      
      setDraggedTransaction(null);
      setDragOverColumn(null);
      
      // Appel API en arrière-plan
      try {
        await onStatusChange(draggedTransaction, columnStatus);
      } catch (error) {
        // En cas d'erreur, restaurer l'état précédent
        if (transactionToUpdate) {
          setLocalTransactions(prev => 
            prev.map(t => t.id === draggedTransaction ? transactionToUpdate : t)
          );
        }
        // L'erreur sera gérée par le composant parent
        throw error;
      }
    } else {
      setDraggedTransaction(null);
      setDragOverColumn(null);
    }
  };

  // Filtrer les transactions selon la recherche (utiliser localTransactions pour les mises à jour optimistes)
  const filteredTransactions = localTransactions.filter((transaction) => {
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
      <div className="flex items-center justify-center py-12 bg-white rounded-3xl">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (localTransactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl">
        <p className="text-gray-500 mb-4">Aucune transaction trouvée</p>
        {onAddTransaction && (
          <Button variant="gradient" onClick={onAddTransaction}>
            <Plus className="w-4 h-4 mr-2" />
            Créer une transaction
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher des transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white border-0 rounded-2xl shadow-sm text-sm placeholder-gray-400"
          />
        </div>
        <Button variant="white" className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          <span className="text-sm font-medium">Filtrer</span>
        </Button>
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
                dragOverColumn === column.id ? 'ring-2 ring-blue-500' : ''
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
                  <h2 className="text-base font-medium text-gray-900">
                    {column.title}
                  </h2>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {columnTransactions.length}
                  </span>
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-xl transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-4 min-h-[200px]">
                {columnTransactions.map((transaction) => {
                  const allParties = [
                    ...(transaction.sellers || []).map((s: any) => s.name),
                    ...(transaction.buyers || []).map((b: any) => b.name),
                  ].filter(Boolean);

                  // Première photo à la une : uniquement une image/photo comme photo par défaut
                  const photos =
                    transaction.documents?.filter(
                      (doc) => doc.type === 'photo' || doc.content_type?.startsWith?.('image/')
                    ) ?? [];
                  const firstPhoto = photos[0];

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
                      className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                        draggedTransaction === transaction.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Photo Header - toujours visible avec photo ou placeholder */}
                      <div className="relative w-full h-32 bg-gray-100 dark:bg-neutral-800 overflow-hidden">
                        {firstPhoto?.url ? (
                          <TransactionImage
                            src={firstPhoto.url}
                            alt={transaction.name}
                            transactionId={transaction.id}
                            documentId={firstPhoto.id}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700">
                            <Home className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-6">
                        {/* Transaction Title */}
                        <h3 className="text-sm font-medium text-gray-900 mb-2">
                          {transaction.name}
                        </h3>

                      {/* Dossier Number */}
                      {transaction.dossier_number && (
                        <p className="text-xs text-gray-500 mb-2">
                          Dossier: {transaction.dossier_number}
                        </p>
                      )}

                      {/* Property Address */}
                      {transaction.property_address && (
                        <div className="flex items-start gap-2 mb-3">
                          <MapPin className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {transaction.property_address}
                            {transaction.property_city && `, ${transaction.property_city}`}
                          </p>
                        </div>
                      )}

                      {/* Property Type */}
                      {transaction.property_type && (
                        <div className="mb-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                            {transaction.property_type}
                          </span>
                        </div>
                      )}

                      {/* Price */}
                      {transaction.final_sale_price && (
                        <div className="flex items-center gap-1 mb-3">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(transaction.final_sale_price)}
                          </span>
                        </div>
                      )}

                      {/* Closing Date */}
                      {transaction.expected_closing_date && (
                        <div className="flex items-center gap-1 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Clôture: {formatDate(transaction.expected_closing_date)}
                          </span>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        {/* Avatars */}
                        {allParties.length > 0 && (
                          <div className="flex -space-x-2">
                            {allParties.slice(0, 3).map((name, index) => (
                              <div
                                key={index}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                                title={name}
                              >
                                {getInitials(name)}
                              </div>
                            ))}
                            {allParties.length > 3 && (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                                +{allParties.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Parties Count */}
                        {allParties.length > 0 && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Users className="w-4 h-4" />
                            <span className="text-xs">{allParties.length}</span>
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
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-medium text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors"
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
