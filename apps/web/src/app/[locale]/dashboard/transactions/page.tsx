'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import TransactionForm from '@/components/transactions/TransactionForm';
import PDFImportModal from '@/components/transactions/PDFImportModal';
import TransactionsPipelineView from '@/components/transactions/TransactionsPipelineView';
import { transactionsAPI } from '@/lib/api';
import { FileText, Plus, Search, MapPin, Calendar, DollarSign, Users, Trash2, Eye, Upload, LayoutGrid, List, Home, TrendingUp, ShoppingCart } from 'lucide-react';
import TransactionImage from '@/components/transactions/TransactionImage';
// Simple date formatting function
const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

interface Transaction {
  id: number;
  name: string;
  dossier_number?: string;
  status: string;
  pipeline_stage?: string | null;
  transaction_kind?: string | null;
  created_at: string;
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_province?: string;
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
  expected_closing_date?: string;
  actual_closing_date?: string;
  possession_date?: string;
  notes?: string;
  documents?: Array<{
    id: number;
    url: string;
    filename: string;
    type?: string;
    [key: string]: any;
  }>;
}

function TransactionsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPDFImportModal, setShowPDFImportModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('pipeline');
  const [pipelineKind, setPipelineKind] = useState<'vente' | 'achat'>('vente');
  const [defaultTransactionKind, setDefaultTransactionKind] = useState<'vente' | 'achat' | null>(null);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionsAPI.list({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      setTransactions(response.data.transactions || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des transactions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [searchQuery, statusFilter]);

  const handleCreate = async (formData: any) => {
    setLoading(true);
    setError(null);
    try {
      await transactionsAPI.create(formData);
      setShowCreateModal(false);
      await loadTransactions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la transaction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePDFImportSuccess = async () => {
    setShowPDFImportModal(false);
    await loadTransactions();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await transactionsAPI.delete(id);
      await loadTransactions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la transaction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (transactionId: number, newPipelineStage: string) => {
    const transactionToUpdate = transactions.find(t => t.id === transactionId);
    if (transactionToUpdate) {
      const updatedTransaction = { ...transactionToUpdate, pipeline_stage: newPipelineStage };
      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? updatedTransaction : t)
      );
    }

    try {
      await transactionsAPI.update(transactionId, { pipeline_stage: newPipelineStage });
      // Do not refetch after success: optimistic state is already correct.
      // Refetching can overwrite with stale/cached data and make the card snap back.
    } catch (err) {
      if (transactionToUpdate) {
        setTransactions(prev =>
          prev.map(t => t.id === transactionId ? transactionToUpdate : t)
        );
      }
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'étape';
      setError(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Conclue':
        return 'success';
      case 'Ferme':
        return 'default';
      case 'Conditionnelle':
        return 'warning';
      case 'Annulée':
        return 'error';
      default:
        return 'info';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };


  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Transactions Immobilières</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez vos transactions immobilières et suivez leur progression
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-2xl shadow-sm">
              <Button
                variant={viewMode === 'pipeline' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('pipeline')}
                className="flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Pipeline
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Liste
              </Button>
            </div>
            <Button
              variant="white"
              onClick={() => setShowPDFImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importer depuis PDF
            </Button>
            <Button
              variant="gradient"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nouvelle transaction
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-4">
            <Alert variant="error" title="Erreur">
              {error}
            </Alert>
          </div>
        )}

        {/* Filters and Search - Only show in list view */}
        {viewMode === 'list' && (
          <Card variant="default" className="rounded-3xl">
            <div className="flex items-center gap-4 p-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-6 py-4 border border-gray-200 rounded-2xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="En cours">En cours</option>
                <option value="Conditionnelle">Conditionnelle</option>
                <option value="Ferme">Ferme</option>
                <option value="Annulée">Annulée</option>
                <option value="Conclue">Conclue</option>
              </select>
            </div>
          </Card>
        )}

        {/* Pipeline View */}
        {viewMode === 'pipeline' ? (
          <div className="space-y-6">
            {/* Pipeline type tabs: Vente | Achat */}
            <div className="flex gap-2 p-1 bg-white rounded-2xl shadow-sm w-fit">
              <button
                type="button"
                onClick={() => setPipelineKind('vente')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pipelineKind === 'vente' ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Pipeline Vente
                <span className="ml-1 text-xs opacity-90">
                  ({transactions.filter(t => t.transaction_kind !== 'achat').length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPipelineKind('achat')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pipelineKind === 'achat' ? 'bg-emerald-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Pipeline Achat
                <span className="ml-1 text-xs opacity-90">
                  ({transactions.filter(t => t.transaction_kind === 'achat').length})
                </span>
              </button>
            </div>

            <TransactionsPipelineView
              key={pipelineKind}
              transactions={
                pipelineKind === 'vente'
                  ? transactions.filter((t) => t.transaction_kind !== 'achat')
                  : transactions.filter((t) => t.transaction_kind === 'achat')
              }
              isLoading={loading}
              onStatusChange={handleStatusChange}
              onAddTransaction={() => {
                setDefaultTransactionKind(pipelineKind);
                setShowCreateModal(true);
              }}
              onTransactionClick={(transaction) => {
                window.location.href = `/dashboard/transactions/${transaction.id}`;
              }}
            />
          </div>
        ) : (
          <>
            {/* Transactions Grid - List View */}
            {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-3xl">
            <Loading />
          </div>
        ) : transactions.length === 0 ? (
          <Card variant="default" className="rounded-3xl">
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-gray-900">Aucune transaction</h3>
              <p className="text-gray-500 mb-4">
                Commencez par créer votre première transaction immobilière
              </p>
              <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une transaction
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transactions.map((transaction) => {
              // Première photo à la une : uniquement une image/photo, pas un document PDF
              const photos = transaction.documents?.filter(
                (doc) => doc.type === 'photo' || doc.content_type?.startsWith?.('image/')
              ) ?? [];
              const firstPhoto = photos[0];

              return (
              <Card
                key={transaction.id}
                variant="default"
                hover
                className="flex flex-col overflow-hidden rounded-3xl"
              >
                {/* Photo Header - toujours visible avec photo ou placeholder */}
                <div className="relative w-full h-48 bg-muted overflow-hidden">
                  {firstPhoto?.url ? (
                    <TransactionImage
                      src={firstPhoto.url}
                      alt={transaction.name}
                      transactionId={transaction.id}
                      documentId={firstPhoto.id}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Home className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {transaction.name}
                      </h3>
                      {transaction.dossier_number && (
                        <p className="text-sm text-muted-foreground mb-1">
                          Dossier: {transaction.dossier_number}
                        </p>
                      )}
                      <Badge variant={getStatusColor(transaction.status) as any}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="space-y-2">
                    {transaction.property_address && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{transaction.property_address}</p>
                          {(transaction.property_city || transaction.property_postal_code) && (
                            <p className="text-muted-foreground">
                              {transaction.property_city}{transaction.property_city && transaction.property_postal_code ? ', ' : ''}{transaction.property_postal_code}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {transaction.property_type && (
                      <p className="text-sm text-muted-foreground">
                        Type: {transaction.property_type}
                      </p>
                    )}
                    
                    {(transaction.bedrooms || transaction.bathrooms) && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.bedrooms && `${transaction.bedrooms} ch.`}
                        {transaction.bedrooms && transaction.bathrooms && ' • '}
                        {transaction.bathrooms && `${transaction.bathrooms} sdb`}
                      </p>
                    )}
                  </div>

                  {/* Parties */}
                  <div className="space-y-1 text-sm">
                    {transaction.sellers && transaction.sellers.length > 0 && transaction.sellers[0]?.name && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Vendeur:</span>
                        <span className="font-medium">{transaction.sellers[0].name}</span>
                      </div>
                    )}
                    {transaction.buyers && transaction.buyers.length > 0 && transaction.buyers[0]?.name && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Acheteur:</span>
                        <span className="font-medium">{transaction.buyers[0].name}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Info */}
                  {transaction.final_sale_price && (
                    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                      <DollarSign className="w-5 h-5" />
                      {formatCurrency(transaction.final_sale_price)}
                    </div>
                  )}

                  {/* Dates */}
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {transaction.expected_closing_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Clôture prévue: {formatDate(transaction.expected_closing_date)}</span>
                      </div>
                    )}
                    {transaction.actual_closing_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Clôture réelle: {formatDate(transaction.actual_closing_date)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 border-t flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      window.location.href = `/dashboard/transactions/${transaction.id}`;
                    }}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(transaction.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
            })}
          </div>
        )}
          </>
        )}

        {/* PDF Import Modal */}
        <PDFImportModal
          isOpen={showPDFImportModal}
          onClose={() => setShowPDFImportModal(false)}
          onSuccess={handlePDFImportSuccess}
        />

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setDefaultTransactionKind(null);
          }}
          title="Nouvelle transaction immobilière"
          size="xl"
        >
          <TransactionForm
            key={`create-${defaultTransactionKind ?? 'none'}`}
            initialData={defaultTransactionKind ? { transaction_kind: defaultTransactionKind } : undefined}
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreateModal(false);
              setDefaultTransactionKind(null);
            }}
            isLoading={loading}
          />
        </Modal>

        {/* View Modal */}
        <Modal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTransaction(null);
          }}
          title={`Transaction ${selectedTransaction?.name}`}
          size="lg"
        >
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <Badge variant={getStatusColor(selectedTransaction.status) as any}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <p>{formatDate(selectedTransaction.created_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Propriété</label>
                <p className="font-medium">{selectedTransaction.property_address}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTransaction.property_city}, {selectedTransaction.property_postal_code}
                </p>
              </div>

              {selectedTransaction.final_sale_price && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prix de vente final</label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedTransaction.final_sale_price)}</p>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm">{selectedTransaction.notes}</p>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  return <TransactionsContent />;
}
