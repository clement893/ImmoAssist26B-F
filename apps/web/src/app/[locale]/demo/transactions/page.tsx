'use client';

import { Plus, Search, Filter, MoreVertical, MessageSquare, Paperclip } from 'lucide-react';

export default function DemoTransactions() {
  const columns = [
    {
      id: 'not-ready',
      title: 'Not Ready',
      color: 'bg-slate-200',
      borderColor: 'border-slate-300',
      count: 4,
    },
    {
      id: 'to-do',
      title: 'To Do',
      color: 'bg-blue-200',
      borderColor: 'border-blue-300',
      count: 5,
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      color: 'bg-amber-200',
      borderColor: 'border-amber-300',
      count: 3,
    },
    {
      id: 'completed',
      title: 'Completed',
      color: 'bg-green-200',
      borderColor: 'border-green-300',
      count: 6,
    },
  ];

  const cards = {
    'not-ready': [
      {
        title: '123 Maple Street',
        description: 'Initial documentation needed',
        image: '/demo/house-1.jpg',
        labels: ['Label', 'Label', 'Label'],
        comments: 3,
        attachments: 1,
        avatars: ['JD', 'SM'],
      },
      {
        title: '456 Oak Avenue',
        description: 'Waiting for seller approval',
        image: '/demo/house-2.jpg',
        labels: ['Label', 'Label'],
        comments: 0,
        attachments: 3,
        avatars: ['AB'],
      },
      {
        title: '789 Pine Road',
        description: 'Property inspection pending',
        image: '/demo/house-3.jpg',
        labels: ['Label'],
        comments: 5,
        attachments: 1,
        avatars: ['CD', 'EF', 'GH'],
      },
    ],
    'to-do': [
      {
        title: '321 Birch Lane',
        description: 'Schedule property viewing',
        image: '/demo/house-4.jpg',
        labels: ['Label', 'Label'],
        comments: 2,
        attachments: 0,
        avatars: ['IJ', 'KL'],
      },
      {
        title: '654 Cedar Court',
        description: 'Prepare offer documents',
        image: '/demo/house-5.jpg',
        labels: ['Label', 'Label', 'Label'],
        comments: 5,
        attachments: 2,
        avatars: ['MN'],
      },
    ],
    'in-progress': [
      {
        title: '987 Elm Street',
        description: 'Negotiating final price',
        image: '/demo/house-6.jpg',
        labels: ['Label', 'Label'],
        comments: 8,
        attachments: 5,
        avatars: ['OP', 'QR'],
      },
      {
        title: '147 Willow Way',
        description: 'Home inspection in progress',
        image: '/demo/house-7.jpg',
        labels: ['Label'],
        comments: 3,
        attachments: 1,
        avatars: ['ST', 'UV', 'WX'],
      },
    ],
    completed: [
      {
        title: '258 Spruce Drive',
        description: 'Contract signed and finalized',
        image: '/demo/house-8.jpg',
        labels: ['Label', 'Label'],
        comments: 12,
        attachments: 8,
        avatars: ['YZ', 'AB'],
      },
      {
        title: '369 Ash Boulevard',
        description: 'Keys handed over to buyer',
        image: '/demo/house-9.jpg',
        labels: ['Label'],
        comments: 6,
        attachments: 3,
        avatars: ['CD'],
      },
    ],
  };

  const labelColors = [
    'bg-blue-100 text-blue-700',
    'bg-green-100 text-green-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-pink-100 text-pink-700',
  ];

  const avatarColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-amber-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-rose-500',
    'bg-teal-500',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Board</h1>
          <p className="mt-2 text-lg text-slate-600">Manage your real estate transactions</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl">
          <Plus className="h-5 w-5" />
          Add Task
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-80 rounded-lg border border-slate-300 bg-slate-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            Sort
          </button>
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
            View
          </button>
          <button className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 transition-colors hover:bg-slate-50">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.id} className="flex flex-col">
            {/* Column Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{column.title}</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
                  {column.count}
                </span>
              </div>
              <button className="text-slate-400 hover:text-slate-600">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {cards[column.id as keyof typeof cards]?.map((card, cardIndex) => (
                <div
                  key={cardIndex}
                  className="group cursor-pointer rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all hover:shadow-md hover:ring-slate-300"
                >
                  {/* Card Image */}
                  {card.image && (
                    <div className="mb-3 overflow-hidden rounded-lg">
                      <div className="h-32 w-full bg-gradient-to-br from-slate-200 to-slate-300" />
                    </div>
                  )}

                  {/* Card Title */}
                  <h4 className="mb-2 font-semibold text-slate-900">{card.title}</h4>

                  {/* Card Description */}
                  <p className="mb-3 text-sm text-slate-600">{card.description}</p>

                  {/* Labels */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {card.labels.map((label, labelIndex) => (
                      <span
                        key={labelIndex}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${labelColors[labelIndex % labelColors.length]}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {card.comments > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-xs font-medium">{card.comments}</span>
                        </div>
                      )}
                      {card.attachments > 0 && (
                        <div className="flex items-center gap-1 text-slate-500">
                          <Paperclip className="h-4 w-4" />
                          <span className="text-xs font-medium">{card.attachments}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex -space-x-2">
                      {card.avatars.map((avatar, avatarIndex) => (
                        <div
                          key={avatarIndex}
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${avatarColors[avatarIndex % avatarColors.length]} text-xs font-bold text-white ring-2 ring-white`}
                        >
                          {avatar}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Card Button */}
              <button className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100">
                <Plus className="h-4 w-4" />
                Add new task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import TransactionForm from '@/components/transactions/TransactionForm';
import PDFImportModal from '@/components/transactions/PDFImportModal';
import { transactionsAPI } from '@/lib/api';
import { FileText, Plus, Search, MapPin, Calendar, DollarSign, Users, Trash2, Eye, Upload } from 'lucide-react';
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
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions Immobilières</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos transactions immobilières et suivez leur progression
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPDFImportModal(true)}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Importer depuis PDF
            </Button>
            <Button
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
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Filters and Search */}
        <Card>
          <div className="flex items-center gap-4 p-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une transaction..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-background text-foreground"
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

        {/* Transactions Grid */}
        {loading && transactions.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : transactions.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune transaction</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première transaction immobilière
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer une transaction
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {transactions.map((transaction) => (
              <Card
                key={transaction.id}
                hover
                className="flex flex-col"
              >
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
            ))}
          </div>
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
          onClose={() => setShowCreateModal(false)}
          title="Nouvelle transaction immobilière"
          size="xl"
        >
          <TransactionForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateModal(false)}
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
