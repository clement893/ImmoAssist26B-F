'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import StatusStepper from '@/components/transactions/StatusStepper';
import { transactionsAPI } from '@/lib/api';
import { calculateTransactionSteps, getTransactionProgressionStatus } from '@/lib/transactions/progression';
import { 
  FileText, 
  Search, 
  Calendar,
  MapPin,
  Users,
  DollarSign,
} from 'lucide-react';

interface Transaction {
  id: number;
  dossier_number: string;
  status: string;
  created_at: string;
  expected_closing_date?: string;
  actual_closing_date?: string;
  property_address: string;
  property_city: string;
  property_postal_code: string;
  sellers: Array<{ name: string; [key: string]: any }>;
  buyers: Array<{ name: string; [key: string]: any }>;
  final_sale_price?: number;
  promise_to_purchase_date?: string;
  promise_acceptance_date?: string;
  inspection_deadline?: string;
  inspection_date?: string;
  inspection_condition_lifted_date?: string;
  financing_deadline?: string;
  financing_condition_lifted_date?: string;
  mortgage_act_signing_date?: string;
  sale_act_signing_date?: string;
  possession_date?: string;
  location_certificate_received?: boolean;
  location_certificate_conform?: boolean;
  seller_declaration_signed?: boolean;
  inspection_report_received?: boolean;
  inspection_report_satisfactory?: boolean;
  financing_approval_received?: boolean;
  financing_approval_date?: string;
  home_insurance_proof_received?: boolean;
  seller_quittance_received?: boolean;
  seller_quittance_confirmed?: boolean;
  registry_publication_number?: string;
  mortgage_institution?: string;
}

// TransactionStep interface is now imported from StatusStepper component

function TransactionStepsContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionsAPI.list({
        search: searchQuery || undefined,
      });
      setTransactions(response.data.transactions || []);
      if (response.data.transactions && response.data.transactions.length > 0 && !selectedTransactionId) {
        setSelectedTransactionId(response.data.transactions[0].id);
        setSelectedTransaction(response.data.transactions[0]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des transactions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactionDetails = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionsAPI.get(id);
      setSelectedTransaction(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la transaction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [searchQuery]);

  useEffect(() => {
    if (selectedTransactionId) {
      const found = transactions.find(t => t.id === selectedTransactionId);
      if (found) {
        setSelectedTransaction(found);
      } else {
        loadTransactionDetails(selectedTransactionId);
      }
    }
  }, [selectedTransactionId]);

  // Utilise la nouvelle logique de progression centralisée
  const getTransactionSteps = (transaction: Transaction) => {
    return calculateTransactionSteps(transaction);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  const steps = selectedTransaction ? getTransactionSteps(selectedTransaction) : [];
  const progression = selectedTransaction ? getTransactionProgressionStatus(selectedTransaction) : null;
  const progress = progression?.overallProgress || 0;

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Étapes des Transactions</h1>
          <p className="text-muted-foreground mt-1">
            Suivez la progression de vos transactions immobilières étape par étape
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Transaction Selector */}
        <Card>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une transaction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <Select
                options={transactions.map(t => ({
                  label: `${t.dossier_number} - ${t.property_address}`,
                  value: t.id.toString(),
                }))}
                value={selectedTransactionId?.toString() || ''}
                onChange={(e) => setSelectedTransactionId(parseInt(e.target.value))}
                placeholder="Sélectionner une transaction"
                className="min-w-[300px]"
              />
            </div>
          </div>
        </Card>

        {/* Transaction Overview */}
        {selectedTransaction && (
          <Card>
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTransaction.dossier_number}</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {selectedTransaction.property_address}, {selectedTransaction.property_city}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {selectedTransaction.sellers && selectedTransaction.sellers.length > 0 && selectedTransaction.sellers[0] && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Vendeur:</span>
                        <span className="font-medium">{selectedTransaction.sellers[0].name}</span>
                      </div>
                    )}
                    {selectedTransaction.buyers && selectedTransaction.buyers.length > 0 && selectedTransaction.buyers[0] && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Acheteur:</span>
                        <span className="font-medium">{selectedTransaction.buyers[0].name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {selectedTransaction.final_sale_price && (
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatCurrency(selectedTransaction.final_sale_price)}
                    </div>
                  )}
                  <Badge variant={selectedTransaction.status === 'Conclue' ? 'success' : 'default'}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progression globale</span>
                  <span className="text-sm text-muted-foreground">{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {progression && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Statut: <span className="font-medium capitalize">{progression.status.replace('_', ' ')}</span>
                    {' • '}
                    Étape actuelle: <span className="font-medium">{progression.currentStep}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Steps Timeline */}
        {loading && !selectedTransaction ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : selectedTransaction && steps.length > 0 ? (
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-6">Étapes de la transaction</h3>
              <StatusStepper steps={steps} showProgress={true} />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune transaction sélectionnée</h3>
              <p className="text-muted-foreground">
                Sélectionnez une transaction pour voir ses étapes
              </p>
            </div>
          </Card>
        )}
      </div>
    </Container>
  );
}

export default function TransactionStepsPage() {
  return <TransactionStepsContent />;
}
