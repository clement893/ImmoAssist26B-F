'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { Plus, Search, Filter, MapPin, DollarSign, Users, Calendar, Home } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TransactionImage from '@/components/transactions/TransactionImage';

interface Transaction {
  id: number;
  name: string;
  dossier_number?: string;
  status: string;
  pipeline_stage?: string | null;
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
  promise_to_purchase_date?: string;
  promise_acceptance_date?: string;
  inspection_condition_lifted_date?: string;
  financing_condition_lifted_date?: string;
  sale_act_signing_date?: string;
  possession_date?: string;
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
  onStatusChange?: (transactionId: number, newPipelineStage: string) => Promise<void>;
  onAddTransaction?: () => void;
  onTransactionClick?: (transaction: Transaction) => void;
}

// Étapes du pipeline (kanban) alignées sur les étapes des offres
const PIPELINE_STAGES = [
  { id: 'creation_dossier', title: 'Création du dossier', subtitle: 'Dossier de transaction créé', color: '#6366f1' },
  { id: 'promesse_achat', title: 'Promesse d\'achat', subtitle: 'En attente d\'acceptation', color: '#f59e0b' },
  { id: 'inspection_batiment', title: 'Inspection du bâtiment', subtitle: 'En attente d\'inspection', color: '#8b5cf6' },
  { id: 'financement_hypothecaire', title: 'Financement hypothécaire', subtitle: 'En attente d\'approbation', color: '#ec4899' },
  { id: 'vente_ferme', title: 'Vente ferme', subtitle: 'En attente de levée de toutes les conditions', color: '#3b82f6' },
  { id: 'documents_notaries', title: 'Documents notariés', subtitle: 'En attente de documents', color: '#06b6d4' },
  { id: 'signature_actes', title: 'Signature des actes', subtitle: 'En attente de signature', color: '#14b8a6' },
  { id: 'prise_possession', title: 'Prise de possession', subtitle: 'En attente de prise de possession', color: '#22c55e' },
  { id: 'finalisation', title: 'Finalisation', subtitle: 'En attente de finalisation', color: '#10b981' },
];

function getEffectivePipelineStage(t: Transaction): string {
  if (t.pipeline_stage && PIPELINE_STAGES.some((s) => s.id === t.pipeline_stage)) return t.pipeline_stage;
  if (t.actual_closing_date || t.status === 'Conclue') return 'finalisation';
  if (t.possession_date) return 'prise_possession';
  if (t.sale_act_signing_date) return 'signature_actes';
  if (t.financing_condition_lifted_date || t.status === 'Ferme') return 'vente_ferme';
  if (t.inspection_condition_lifted_date) return 'financement_hypothecaire';
  if (t.promise_acceptance_date) return 'inspection_batiment';
  if (t.promise_to_purchase_date) return 'promesse_achat';
  return 'creation_dossier';
}

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
  // Ignore the next click after a drop (browser often fires click after drop)
  const [ignoreNextClick, setIgnoreNextClick] = useState(false);
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

  const handleDrop = async (e: React.DragEvent, columnStageId: string) => {
    e.preventDefault();
    if (draggedTransaction && onStatusChange) {
      const transactionToUpdate = localTransactions.find(t => t.id === draggedTransaction);
      if (transactionToUpdate) {
        const updatedTransaction = { ...transactionToUpdate, pipeline_stage: columnStageId };
        setLocalTransactions(prev =>
          prev.map(t => (t.id === draggedTransaction ? updatedTransaction : t))
        );
      }

      setDraggedTransaction(null);
      setDragOverColumn(null);
      // Prevent the drop from triggering a click on the card (browser often fires click after drop)
      setIgnoreNextClick(true);
      setTimeout(() => setIgnoreNextClick(false), 300);

      try {
        await onStatusChange(draggedTransaction, columnStageId);
      } catch (error) {
        if (transactionToUpdate) {
          setLocalTransactions(prev =>
            prev.map(t => (t.id === draggedTransaction ? transactionToUpdate : t))
          );
        }
        throw error;
      }
    } else {
      setDraggedTransaction(null);
      setDragOverColumn(null);
    }
  };

  // Filtrer les transactions selon la recherche
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

      {/* Kanban Board - 9 colonnes, défilement horizontal */}
      <div className="flex gap-6 overflow-x-auto pb-4 min-h-[400px]" style={{ scrollSnapType: 'x mandatory' }}>
        {PIPELINE_STAGES.map((column) => {
          const columnTransactions = filteredTransactions.filter(
            (transaction) => getEffectivePipelineStage(transaction) === column.id
          );

          return (
            <div
              key={column.id}
              className={`flex-shrink-0 w-72 flex flex-col rounded-2xl bg-gray-50/80 dark:bg-neutral-900/50 p-4 ${
                dragOverColumn === column.id ? 'ring-2 ring-primary-500' : ''
              }`}
              style={{ scrollSnapAlign: 'start' }}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: column.color }}
                  />
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {column.title}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{column.subtitle}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-white dark:bg-neutral-800 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full shadow-sm">
                  {columnTransactions.length}
                </span>
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
                        if (ignoreNextClick) return;
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

                      {/* Price: final_sale_price > offered_price > listing_price */}
                      {(transaction.final_sale_price ?? transaction.offered_price ?? transaction.listing_price) != null && (
                        <div className="flex items-center gap-1 mb-3">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(transaction.final_sale_price ?? transaction.offered_price ?? transaction.listing_price)}
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
