'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { transactionsAPI } from '@/lib/api';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar,
  MapPin,
  Users,
  DollarSign,
  FileCheck,
  Home,
  Building2,
  ArrowRight,
  XCircle
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
  home_insurance_proof_received?: boolean;
  seller_quittance_received?: boolean;
  seller_quittance_confirmed?: boolean;
}

interface TransactionStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'completed' | 'current' | 'pending' | 'blocked';
  date?: string;
  deadline?: string;
  details?: string[];
}

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

  const getTransactionSteps = (transaction: Transaction): TransactionStep[] => {
    const steps: TransactionStep[] = [];
    const now = new Date();

    // 1. Création du dossier
    steps.push({
      id: 'creation',
      title: 'Création du dossier',
      description: 'Dossier de transaction créé',
      icon: <FileText className="w-5 h-5" />,
      status: 'completed',
      date: transaction.created_at,
      details: [
        `Numéro de dossier: ${transaction.dossier_number}`,
        `Statut initial: ${transaction.status}`,
      ],
    });

    // 2. Promesse d'achat
    const promiseDate = transaction.promise_to_purchase_date ? new Date(transaction.promise_to_purchase_date) : null;
    const promiseAccepted = !!transaction.promise_acceptance_date;
    steps.push({
      id: 'promise',
      title: 'Promesse d\'achat',
      description: promiseAccepted ? 'Promesse d\'achat acceptée' : 'En attente de promesse d\'achat',
      icon: <FileCheck className="w-5 h-5" />,
      status: promiseAccepted ? 'completed' : promiseDate ? 'current' : 'pending',
      date: transaction.promise_acceptance_date || transaction.promise_to_purchase_date,
      details: promiseAccepted ? [
        `Date de la promesse: ${formatDate(transaction.promise_to_purchase_date)}`,
        `Date d'acceptation: ${formatDate(transaction.promise_acceptance_date)}`,
      ] : undefined,
    });

    // 3. Inspection
    const inspectionDeadline = transaction.inspection_deadline ? new Date(transaction.inspection_deadline) : null;
    const inspectionDone = !!transaction.inspection_date;
    const inspectionLifted = !!transaction.inspection_condition_lifted_date;
    const inspectionSatisfactory = transaction.inspection_report_satisfactory;
    
    let inspectionStatus: 'completed' | 'current' | 'pending' | 'blocked' = 'pending';
    if (inspectionLifted) {
      inspectionStatus = 'completed';
    } else if (inspectionDone && inspectionSatisfactory === false) {
      inspectionStatus = 'blocked';
    } else if (inspectionDone || (inspectionDeadline && now >= inspectionDeadline)) {
      inspectionStatus = 'current';
    }

    steps.push({
      id: 'inspection',
      title: 'Inspection du bâtiment',
      description: inspectionLifted 
        ? 'Inspection complétée et condition levée' 
        : inspectionDone 
        ? 'Inspection effectuée - En attente de levée de condition'
        : 'En attente d\'inspection',
      icon: <Home className="w-5 h-5" />,
      status: inspectionStatus,
      date: transaction.inspection_condition_lifted_date || transaction.inspection_date,
      deadline: transaction.inspection_deadline,
      details: [
        inspectionDone && `Date d'inspection: ${formatDate(transaction.inspection_date)}`,
        inspectionDeadline && `Date limite: ${formatDate(transaction.inspection_deadline)}`,
        inspectionLifted && `Condition levée: ${formatDate(transaction.inspection_condition_lifted_date)}`,
        transaction.inspection_report_received && 'Rapport d\'inspection reçu',
        inspectionSatisfactory !== undefined && `Rapport ${inspectionSatisfactory ? 'satisfaisant' : 'non satisfaisant'}`,
      ].filter(Boolean) as string[],
    });

    // 4. Financement
    const financingDeadline = transaction.financing_deadline ? new Date(transaction.financing_deadline) : null;
    const financingApproved = transaction.financing_approval_received;
    const financingLifted = !!transaction.financing_condition_lifted_date;
    
    let financingStatus: 'completed' | 'current' | 'pending' | 'blocked' = 'pending';
    if (financingLifted) {
      financingStatus = 'completed';
    } else if (financingApproved) {
      financingStatus = 'current';
    } else if (financingDeadline && now >= financingDeadline) {
      financingStatus = 'current';
    }

    steps.push({
      id: 'financing',
      title: 'Financement hypothécaire',
      description: financingLifted 
        ? 'Financement approuvé et condition levée' 
        : financingApproved 
        ? 'Financement approuvé - En attente de levée de condition'
        : 'En attente d\'approbation',
      icon: <DollarSign className="w-5 h-5" />,
      status: financingStatus,
      date: transaction.financing_condition_lifted_date || transaction.financing_approval_date,
      deadline: transaction.financing_deadline,
      details: [
        financingApproved && `Approbation reçue: ${formatDate(transaction.financing_approval_date)}`,
        financingDeadline && `Date limite: ${formatDate(transaction.financing_deadline)}`,
        financingLifted && `Condition levée: ${formatDate(transaction.financing_condition_lifted_date)}`,
      ].filter(Boolean) as string[],
    });

    // 5. Documents notariés
    const locationCertReceived = transaction.location_certificate_received;
    const locationCertConform = transaction.location_certificate_conform;
    const sellerDeclSigned = transaction.seller_declaration_signed;
    const insuranceReceived = transaction.home_insurance_proof_received;
    
    const documentsComplete = locationCertReceived && locationCertConform && sellerDeclSigned && insuranceReceived;
    
    steps.push({
      id: 'documents',
      title: 'Documents notariés',
      description: documentsComplete 
        ? 'Tous les documents requis sont prêts' 
        : 'En attente de documents',
      icon: <FileCheck className="w-5 h-5" />,
      status: documentsComplete ? 'completed' : 'current',
      details: [
        locationCertReceived && `Certificat de localisation: ${locationCertConform ? 'Conforme' : 'Non conforme'}`,
        sellerDeclSigned && 'Déclaration du vendeur signée',
        insuranceReceived && 'Preuve d\'assurance habitation reçue',
      ].filter(Boolean) as string[],
    });

    // 6. Signature des actes
    const mortgageActSigned = !!transaction.mortgage_act_signing_date;
    const saleActSigned = !!transaction.sale_act_signing_date;
    const closingDate = transaction.actual_closing_date ? new Date(transaction.actual_closing_date) : null;
    const expectedClosing = transaction.expected_closing_date ? new Date(transaction.expected_closing_date) : null;
    
    let signingStatus: 'completed' | 'current' | 'pending' | 'blocked' = 'pending';
    if (saleActSigned) {
      signingStatus = 'completed';
    } else if (mortgageActSigned || (expectedClosing && now >= expectedClosing)) {
      signingStatus = 'current';
    }

    steps.push({
      id: 'signing',
      title: 'Signature des actes',
      description: saleActSigned 
        ? 'Actes signés - Transaction conclue' 
        : mortgageActSigned 
        ? 'Acte d\'hypothèque signé - En attente de l\'acte de vente'
        : 'En attente de signature',
      icon: <FileCheck className="w-5 h-5" />,
      status: signingStatus,
      date: transaction.sale_act_signing_date || transaction.mortgage_act_signing_date,
      deadline: transaction.expected_closing_date,
      details: [
        mortgageActSigned && `Acte d'hypothèque signé: ${formatDate(transaction.mortgage_act_signing_date)}`,
        saleActSigned && `Acte de vente signé: ${formatDate(transaction.sale_act_signing_date)}`,
        expectedClosing && `Date prévue: ${formatDate(transaction.expected_closing_date)}`,
        closingDate && `Date réelle: ${formatDate(transaction.actual_closing_date)}`,
      ].filter(Boolean) as string[],
    });

    // 7. Prise de possession
    const possessionDate = transaction.possession_date ? new Date(transaction.possession_date) : null;
    const possessionDone = possessionDate && now >= possessionDate;
    
    steps.push({
      id: 'possession',
      title: 'Prise de possession',
      description: possessionDone 
        ? 'Prise de possession effectuée' 
        : possessionDate 
        ? `Prise de possession prévue le ${formatDate(transaction.possession_date)}`
        : 'En attente de prise de possession',
      icon: <Home className="w-5 h-5" />,
      status: possessionDone ? 'completed' : possessionDate ? 'current' : 'pending',
      date: transaction.possession_date,
      details: [
        possessionDate && `Date: ${formatDate(transaction.possession_date)}`,
      ].filter(Boolean) as string[],
    });

    // 8. Finalisation
    const quittanceReceived = transaction.seller_quittance_received;
    const quittanceConfirmed = transaction.seller_quittance_confirmed;
    const finalizationComplete = quittanceConfirmed && saleActSigned;
    
    steps.push({
      id: 'finalization',
      title: 'Finalisation',
      description: finalizationComplete 
        ? 'Transaction finalisée' 
        : quittanceReceived 
        ? 'Quittance reçue - En attente de confirmation'
        : 'En attente de finalisation',
      icon: <CheckCircle2 className="w-5 h-5" />,
      status: finalizationComplete ? 'completed' : quittanceReceived ? 'current' : 'pending',
      details: [
        quittanceReceived && 'Quittance du vendeur reçue',
        quittanceConfirmed && 'Quittance confirmée',
        transaction.registry_publication_number && `Publication: ${transaction.registry_publication_number}`,
      ].filter(Boolean) as string[],
    });

    return steps;
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

  const getStepIcon = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-success-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-primary-600 animate-pulse" />;
      case 'blocked':
        return <XCircle className="w-6 h-6 text-error-600" />;
      default:
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStepColor = (step: TransactionStep) => {
    switch (step.status) {
      case 'completed':
        return 'border-success-500 bg-success-50 dark:bg-success-950';
      case 'current':
        return 'border-primary-500 bg-primary-50 dark:bg-primary-950';
      case 'blocked':
        return 'border-error-500 bg-error-50 dark:bg-error-950';
      default:
        return 'border-muted bg-muted/30';
    }
  };

  const getProgressPercentage = (steps: TransactionStep[]) => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  };

  const steps = selectedTransaction ? getTransactionSteps(selectedTransaction) : [];
  const progress = steps.length > 0 ? getProgressPercentage(steps) : 0;

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
                    {selectedTransaction.sellers && selectedTransaction.sellers.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Vendeur:</span>
                        <span className="font-medium">{selectedTransaction.sellers[0].name}</span>
                      </div>
                    )}
                    {selectedTransaction.buyers && selectedTransaction.buyers.length > 0 && (
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
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const isLast = index === steps.length - 1;
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.status === 'current';
                  const isBlocked = step.status === 'blocked';

                  return (
                    <div key={step.id} className="relative">
                      {/* Connector Line */}
                      {!isLast && (
                        <div
                          className={`absolute left-3 top-8 w-0.5 h-full ${
                            isCompleted ? 'bg-success-500' : 'bg-muted'
                          }`}
                          style={{ height: 'calc(100% - 2rem)' }}
                        />
                      )}

                      {/* Step Content */}
                      <div className="flex gap-4">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStepColor(step)}`}>
                          {getStepIcon(step)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className={`text-lg font-semibold ${
                                isCompleted ? 'text-success-600' : 
                                isCurrent ? 'text-primary-600' : 
                                isBlocked ? 'text-error-600' : 
                                'text-muted-foreground'
                              }`}>
                                {step.title}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                            </div>
                            {step.date && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(step.date)}</span>
                              </div>
                            )}
                          </div>

                          {step.deadline && !step.date && (
                            <div className="flex items-center gap-1 text-sm text-warning-600 mb-2">
                              <Clock className="w-4 h-4" />
                              <span>Date limite: {formatDate(step.deadline)}</span>
                            </div>
                          )}

                          {step.details && step.details.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                  <span className="text-primary-600 mt-1">•</span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
