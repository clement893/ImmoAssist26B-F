'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { transactionsAPI } from '@/lib/api';
import InlineEditableField from '@/components/transactions/InlineEditableField';
import TransactionSummaryCard from '@/components/transactions/TransactionSummaryCard';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  FileText,
  Home,
  Clock,
  Upload,
  Trash2,
  Eye,
  Receipt,
  Shield,
  History,
  Image as ImageIcon,
} from 'lucide-react';

interface Transaction {
  id: number;
  name: string;
  dossier_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
  expected_closing_date?: string;
  actual_closing_date?: string;
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_province?: string;
  lot_number?: string;
  matricule_number?: string;
  property_type?: string;
  construction_year?: number;
  land_area_sqft?: number;
  land_area_sqm?: number;
  living_area_sqft?: number;
  living_area_sqm?: number;
  total_rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  inclusions?: string[];
  exclusions?: string[];
  sellers?: Array<{ name: string; [key: string]: any }>;
  buyers?: Array<{ name: string; [key: string]: any }>;
  seller_broker?: { name: string; [key: string]: any };
  buyer_broker?: { name: string; [key: string]: any };
  notary?: { name: string; [key: string]: any };
  inspector?: { name: string; [key: string]: any };
  surveyor?: { name: string; [key: string]: any };
  mortgage_advisor?: { name: string; [key: string]: any };
  listing_price?: number;
  offered_price?: number;
  final_sale_price?: number;
  deposit_amount?: number;
  broker_commission_percent?: number;
  broker_commission_amount?: number;
  down_payment_amount?: number;
  mortgage_amount?: number;
  mortgage_institution?: string;
  mortgage_type?: string;
  mortgage_interest_rate?: number;
  mortgage_term_years?: number;
  amortization_years?: number;
  mortgage_insurance_required: boolean;
  mortgage_insurance_amount?: number;
  promise_to_purchase_date?: string;
  promise_acceptance_date?: string;
  inspection_deadline?: string;
  inspection_date?: string;
  inspection_condition_lifted_date?: string;
  financing_deadline?: string;
  financing_condition_lifted_date?: string;
  financing_approval_date?: string;
  mortgage_act_signing_date?: string;
  sale_act_signing_date?: string;
  possession_date?: string;
  location_certificate_received: boolean;
  location_certificate_date?: string;
  location_certificate_conform?: boolean;
  seller_declaration_signed: boolean;
  seller_declaration_date?: string;
  inspection_report_received: boolean;
  inspection_report_satisfactory?: boolean;
  financing_approval_received: boolean;
  registry_publication_number?: string;
  registry_publication_date?: string;
  notes?: string;
  documents?: Array<{
    id: number;
    filename: string;
    url: string;
    file_key?: string;
    size?: number;
    content_type?: string;
    description?: string;
    uploaded_at?: string;
    uploaded_by?: number;
    type?: string; // 'photo' or 'document'
  }>;
}

const STATUS_OPTIONS = [
  { label: 'En cours', value: 'En cours' },
  { label: 'Conditionnelle', value: 'Conditionnelle' },
  { label: 'Ferme', value: 'Ferme' },
  { label: 'Annulée', value: 'Annulée' },
  { label: 'Conclue', value: 'Conclue' },
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Unifamiliale', value: 'Unifamiliale' },
  { label: 'Condo', value: 'Condo' },
  { label: 'Duplex', value: 'Duplex' },
  { label: 'Triplex', value: 'Triplex' },
  { label: 'Quadruplex', value: 'Quadruplex' },
  { label: 'Terrain', value: 'Terrain' },
  { label: 'Commercial', value: 'Commercial' },
  { label: 'Autre', value: 'Autre' },
];

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatCurrency(amount?: number): string {
  if (!amount) return '-';
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}


export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params.id as string;
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionsAPI.get(parseInt(transactionId));
      setTransaction(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldUpdate = async (field: string, value: string | number) => {
    if (!transaction) return;
    
    setSaving({ ...saving, [field]: true });
    try {
      const updateData: Record<string, any> = { [field]: value };
      const response = await transactionsAPI.update(parseInt(transactionId), updateData);
      setTransaction(response.data);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving({ ...saving, [field]: false });
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      </Container>
    );
  }

  if (error || !transaction) {
    return (
      <Container>
        <Alert variant="error" title="Erreur">
          {error || 'Transaction introuvable'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-4">
        {/* Breadcrumbs */}
        <Breadcrumb
          items={[
            { label: 'Transactions', href: '/dashboard/transactions', icon: <FileText className="w-4 h-4" /> },
            { label: transaction.name },
          ]}
          showHome={true}
          homeHref="/dashboard"
        />

        {/* Summary Card */}
        <TransactionSummaryCard transaction={transaction} />

        {/* Tabs */}
        <Tabs defaultTab="information">
          <TabList className="border-b border-slate-200 dark:border-slate-700">
            <Tab value="information">
              <FileText className="w-4 h-4 mr-2" />
              Information
            </Tab>
            <Tab value="photos">
              <ImageIcon className="w-4 h-4 mr-2" />
              Photos
              {transaction.documents && transaction.documents.filter(d => d.type === 'photo').length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                  {transaction.documents.filter(d => d.type === 'photo').length}
                </span>
              )}
            </Tab>
            <Tab value="documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents
              {transaction.documents && transaction.documents.filter(d => d.type !== 'photo').length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                  {transaction.documents.filter(d => d.type !== 'photo').length}
                </span>
              )}
            </Tab>
            <Tab value="transactions">
              <Receipt className="w-4 h-4 mr-2" />
              Transactions
            </Tab>
            <Tab value="deposits">
              <Shield className="w-4 h-4 mr-2" />
              Dépôts de sécurité
            </Tab>
            <Tab value="balance">
              <DollarSign className="w-4 h-4 mr-2" />
              Solde
            </Tab>
            <Tab value="history">
              <History className="w-4 h-4 mr-2" />
              Historique
            </Tab>
          </TabList>

          <TabPanels>
            {/* Information Tab */}
            <TabPanel value="information">
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left Column - Main Info */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Identification */}
                    <Card>
                      <div className="p-4 space-y-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Identification
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InlineEditableField
                            label="Nom de la transaction"
                            value={transaction.name}
                            onSave={(value) => handleFieldUpdate('name', value as string)}
                          />
                          <InlineEditableField
                            label="Numéro de dossier"
                            value={transaction.dossier_number}
                            onSave={(value) => handleFieldUpdate('dossier_number', value as string)}
                            placeholder="Optionnel"
                          />
                          <InlineEditableField
                            label="Statut"
                            value={transaction.status}
                            type="select"
                            options={STATUS_OPTIONS}
                            onSave={(value) => handleFieldUpdate('status', value as string)}
                          />
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                            <p className="text-base font-medium">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    </Card>

                    {/* Property Info */}
                    <Card>
                      <div className="p-4 space-y-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Propriété
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InlineEditableField
                            label="Adresse"
                            value={transaction.property_address}
                            onSave={(value) => handleFieldUpdate('property_address', value as string)}
                            placeholder="123 Rue Principale"
                          />
                          <InlineEditableField
                            label="Ville"
                            value={transaction.property_city}
                            onSave={(value) => handleFieldUpdate('property_city', value as string)}
                          />
                          <InlineEditableField
                            label="Code postal"
                            value={transaction.property_postal_code}
                            onSave={(value) => handleFieldUpdate('property_postal_code', value as string)}
                          />
                          <InlineEditableField
                            label="Province"
                            value={transaction.property_province}
                            onSave={(value) => handleFieldUpdate('property_province', value as string)}
                          />
                          <InlineEditableField
                            label="Type de propriété"
                            value={transaction.property_type}
                            type="select"
                            options={PROPERTY_TYPE_OPTIONS}
                            onSave={(value) => handleFieldUpdate('property_type', value as string)}
                          />
                          <InlineEditableField
                            label="Année de construction"
                            value={transaction.construction_year}
                            type="number"
                            onSave={(value) => handleFieldUpdate('construction_year', value as number)}
                          />
                          <InlineEditableField
                            label="Superficie du terrain (pi²)"
                            value={transaction.land_area_sqft}
                            type="number"
                            onSave={(value) => handleFieldUpdate('land_area_sqft', value as number)}
                          />
                          <InlineEditableField
                            label="Superficie habitable (pi²)"
                            value={transaction.living_area_sqft}
                            type="number"
                            onSave={(value) => handleFieldUpdate('living_area_sqft', value as number)}
                          />
                          <InlineEditableField
                            label="Nombre de chambres"
                            value={transaction.bedrooms}
                            type="number"
                            onSave={(value) => handleFieldUpdate('bedrooms', value as number)}
                          />
                          <InlineEditableField
                            label="Nombre de salles de bain"
                            value={transaction.bathrooms}
                            type="number"
                            onSave={(value) => handleFieldUpdate('bathrooms', value as number)}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Financial Info */}
                    <Card>
                      <div className="p-4 space-y-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Informations financières
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InlineEditableField
                            label="Prix demandé"
                            value={transaction.listing_price}
                            type="number"
                            formatValue={(val) => formatCurrency(val as number)}
                            onSave={(value) => handleFieldUpdate('listing_price', value as number)}
                          />
                          <InlineEditableField
                            label="Prix offert"
                            value={transaction.offered_price}
                            type="number"
                            formatValue={(val) => formatCurrency(val as number)}
                            onSave={(value) => handleFieldUpdate('offered_price', value as number)}
                          />
                          <InlineEditableField
                            label="Prix de vente final"
                            value={transaction.final_sale_price}
                            type="number"
                            formatValue={(val) => formatCurrency(val as number)}
                            onSave={(value) => handleFieldUpdate('final_sale_price', value as number)}
                          />
                          <InlineEditableField
                            label="Montant du dépôt"
                            value={transaction.deposit_amount}
                            type="number"
                            formatValue={(val) => formatCurrency(val as number)}
                            onSave={(value) => handleFieldUpdate('deposit_amount', value as number)}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Dates */}
                    <Card>
                      <div className="p-4 space-y-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Dates importantes
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <InlineEditableField
                            label="Date de promesse d'achat"
                            value={transaction.promise_to_purchase_date}
                            type="date"
                            formatValue={(val) => formatDate(val as string)}
                            onSave={(value) => handleFieldUpdate('promise_to_purchase_date', value as string)}
                          />
                          <InlineEditableField
                            label="Date d'acceptation"
                            value={transaction.promise_acceptance_date}
                            type="date"
                            formatValue={(val) => formatDate(val as string)}
                            onSave={(value) => handleFieldUpdate('promise_acceptance_date', value as string)}
                          />
                          <InlineEditableField
                            label="Date de clôture prévue"
                            value={transaction.expected_closing_date}
                            type="date"
                            formatValue={(val) => formatDate(val as string)}
                            onSave={(value) => handleFieldUpdate('expected_closing_date', value as string)}
                          />
                          <InlineEditableField
                            label="Date de clôture réelle"
                            value={transaction.actual_closing_date}
                            type="date"
                            formatValue={(val) => formatDate(val as string)}
                            onSave={(value) => handleFieldUpdate('actual_closing_date', value as string)}
                          />
                          <InlineEditableField
                            label="Date de prise de possession"
                            value={transaction.possession_date}
                            type="date"
                            formatValue={(val) => formatDate(val as string)}
                            onSave={(value) => handleFieldUpdate('possession_date', value as string)}
                          />
                        </div>
                      </div>
                    </Card>

                    {/* Notes */}
                    <Card>
                      <div className="p-4 space-y-4">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Notes
                        </h2>
                        <InlineEditableField
                          label="Notes"
                          value={transaction.notes || ''}
                          type="textarea"
                          onSave={(value) => handleFieldUpdate('notes', value as string)}
                        />
                      </div>
                    </Card>
                  </div>

                  {/* Right Column - Sidebar */}
                  <div className="space-y-4">
                    {/* Parties */}
                    <Card>
                      <div className="p-4 space-y-3">
                        <h2 className="text-base font-semibold flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Parties impliquées
                        </h2>
                        {transaction.sellers && transaction.sellers.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Vendeurs</h3>
                            <div className="space-y-1">
                              {transaction.sellers.map((seller, idx) => (
                                <p key={idx} className="text-sm">{seller.name}</p>
                              ))}
                            </div>
                          </div>
                        )}
                        {transaction.buyers && transaction.buyers.length > 0 && (
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">Acheteurs</h3>
                            <div className="space-y-1">
                              {transaction.buyers.map((buyer, idx) => (
                                <p key={idx} className="text-sm">{buyer.name}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                      <div className="p-4 space-y-3">
                        <h2 className="text-base font-semibold">Actions rapides</h2>
                        <div className="space-y-2">
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => router.push(`/dashboard/transactions/steps?id=${transaction.id}`)}
                          >
                            <Clock className="w-4 h-4 mr-2" />
                            Voir les étapes
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </TabPanel>

            {/* Photos Tab */}
            <TabPanel value="photos">
              <div className="mt-4">
                <Card>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Photos
                      </h2>
                      <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        Ajouter une photo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                              try {
                                setSaving({ ...saving, photos: true });
                                const response = await transactionsAPI.addPhoto(
                                  parseInt(transactionId),
                                  selectedFile
                                );
                                setTransaction(response.data);
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la photo');
                              } finally {
                                setSaving({ ...saving, photos: false });
                                e.target.value = '';
                              }
                            }
                          }}
                          disabled={saving.photos}
                        />
                      </label>
                    </div>
                    
                    {transaction.documents && transaction.documents.filter(d => d.type === 'photo').length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {transaction.documents.filter(d => d.type === 'photo').map((photo) => (
                          <div
                            key={photo.id}
                            className="group relative aspect-square border border-border rounded-lg overflow-hidden bg-muted hover:shadow-lg transition-shadow"
                          >
                            <img
                              src={photo.url}
                              alt={photo.description || photo.filename}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(photo.url, '_blank')}
                                  title="Voir la photo"
                                  className="text-white hover:bg-white/20"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async () => {
                                    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
                                      try {
                                        setSaving({ ...saving, [`photo_${photo.id}`]: true });
                                        const response = await transactionsAPI.removeDocument(
                                          parseInt(transactionId),
                                          photo.id
                                        );
                                        setTransaction(response.data);
                                      } catch (err) {
                                        setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
                                      } finally {
                                        setSaving({ ...saving, [`photo_${photo.id}`]: false });
                                      }
                                    }
                                  }}
                                  disabled={saving[`photo_${photo.id}`]}
                                  title="Supprimer la photo"
                                  className="text-white hover:bg-white/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {photo.description && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                                {photo.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucune photo associée à cette transaction</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Documents Tab */}
            <TabPanel value="documents">
              <div className="mt-4">
                <Card>
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documents
                      </h2>
                      <label className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors text-sm">
                        <Upload className="w-4 h-4" />
                        Ajouter un document
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const selectedFile = e.target.files?.[0];
                            if (selectedFile) {
                              try {
                                setSaving({ ...saving, documents: true });
                                const response = await transactionsAPI.addDocument(
                                  parseInt(transactionId),
                                  selectedFile
                                );
                                setTransaction(response.data);
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Erreur lors de l\'ajout du document');
                              } finally {
                                setSaving({ ...saving, documents: false });
                                e.target.value = '';
                              }
                            }
                          }}
                          disabled={saving.documents}
                        />
                      </label>
                    </div>
                    
                    {transaction.documents && transaction.documents.filter(d => d.type !== 'photo').length > 0 ? (
                      <div className="space-y-2">
                        {transaction.documents.filter(d => d.type !== 'photo').map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{doc.filename}</p>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                                )}
                                {doc.size && (
                                  <p className="text-xs text-muted-foreground">
                                    {(doc.size / 1024).toFixed(2)} KB
                                    {doc.uploaded_at && ` • ${formatDate(doc.uploaded_at)}`}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {doc.url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(doc.url, '_blank')}
                                  title="Voir le document"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
                                    try {
                                      setSaving({ ...saving, [`doc_${doc.id}`]: true });
                                      const response = await transactionsAPI.removeDocument(
                                        parseInt(transactionId),
                                        doc.id
                                      );
                                      setTransaction(response.data);
                                    } catch (err) {
                                      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
                                    } finally {
                                      setSaving({ ...saving, [`doc_${doc.id}`]: false });
                                    }
                                  }
                                }}
                                disabled={saving[`doc_${doc.id}`]}
                                title="Supprimer le document"
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun document associé à cette transaction</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Transactions Tab */}
            <TabPanel value="transactions">
              <div className="mt-4">
                <Card>
                  <div className="p-4">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                      <Receipt className="w-4 h-4" />
                      Historique financier
                    </h2>
                    <div className="text-center py-12 text-muted-foreground">
                      <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Fonctionnalité à venir</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Deposits Tab */}
            <TabPanel value="deposits">
              <div className="mt-4">
                <Card>
                  <div className="p-4">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                      <Shield className="w-4 h-4" />
                      Dépôts de sécurité
                    </h2>
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Fonctionnalité à venir</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* Balance Tab */}
            <TabPanel value="balance">
              <div className="mt-4">
                <Card>
                  <div className="p-4">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4" />
                      Solde
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground mb-1.5">Solde du bail</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrency(transaction.deposit_amount ? -transaction.deposit_amount : 0)}
                          </p>
                        </div>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <div className="p-4">
                          <p className="text-xs text-muted-foreground mb-1.5">Dépôts de sécurité</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(transaction.deposit_amount)}
                          </p>
                        </div>
                      </Card>
                    </div>
                    <div className="text-center py-8 text-muted-foreground">
                      <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Détails financiers à venir</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabPanel>

            {/* History Tab */}
            <TabPanel value="history">
              <div className="mt-4">
                <Card>
                  <div className="p-4">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-3">
                      <History className="w-4 h-4" />
                      Historique
                    </h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <div className="flex-1">
                          <p className="text-xs font-medium">Transaction créée</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      {transaction.updated_at !== transaction.created_at && (
                        <div className="flex items-center gap-3 p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">Dernière modification</p>
                            <p className="text-[10px] text-muted-foreground">{formatDate(transaction.updated_at)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </Container>
  );
}
