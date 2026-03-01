'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { transactionsAPI, realEstateContactsAPI, leaAPI } from '@/lib/api';
import TransactionTimeline from '@/components/transactions/TransactionTimeline';
import StatusStepper from '@/components/transactions/StatusStepper';
import TransactionStepsV2 from '@/components/transactions/TransactionStepsV2';
import TransactionFormsTab from '@/components/transactions/TransactionFormsTab';
import AddContactToTransactionModal from '@/components/transactions/AddContactToTransactionModal';
import AddressAutocompleteInput, { type AddressResult } from '@/components/transactions/AddressAutocompleteInput';
import { calculateTransactionSteps } from '@/lib/transactions/progression';
import { useToast } from '@/components/ui';
import { 
  FileText,
  Upload,
  Image as ImageIcon,
  ChevronRight,
  Edit,
  Send,
  MessageSquare,
  Download,
  Paperclip,
  Plus,
  Trash2,
  ClipboardList,
  FileCheck,
  Users,
  Star,
  Bot,
  DollarSign,
  MapPin,
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
  cover_photo_id?: number | null;
}


const TAB_IDS = ['steps', 'documents', 'activity', 'photos', 'forms', 'contacts', 'map', 'lea'] as const;

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const transactionId = params.id as string;
  const locale = (params?.locale as string) || 'fr';
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('steps');
  const [newComment, setNewComment] = useState('');
  const [transactionContacts, setTransactionContacts] = useState<Array<{ transaction_id: number; contact_id: number; role: string; created_at: string; contact: { id: number; first_name: string; last_name: string; email?: string; phone?: string; company?: string } }>>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [leaConversations, setLeaConversations] = useState<Array<{ session_id: string; title: string; updated_at: string | null }>>([]);
  const [leaConversationsLoading, setLeaConversationsLoading] = useState(false);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editAddressSaving, setEditAddressSaving] = useState(false);
  const [editAddressForm, setEditAddressForm] = useState({
    property_address: '',
    property_city: '',
    property_postal_code: '',
    property_province: 'QC',
  });

  // Sync active tab with URL ?tab=...
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && TAB_IDS.includes(tab as (typeof TAB_IDS)[number])) {
      setActiveTab(tab as (typeof TAB_IDS)[number]);
    }
  }, [searchParams]);

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

  const loadTransactionContacts = async () => {
    if (!transactionId) return;
    try {
      setContactsLoading(true);
      const res = await realEstateContactsAPI.getTransactionContacts(parseInt(transactionId));
      setTransactionContacts(res.data?.contacts ?? []);
    } catch {
      setTransactionContacts([]);
    } finally {
      setContactsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contacts') {
      loadTransactionContacts();
    }
  }, [activeTab, transactionId]);

  const loadLeaConversations = async () => {
    if (!transactionId) return;
    try {
      setLeaConversationsLoading(true);
      const res = await leaAPI.listConversationsByTransaction(parseInt(transactionId));
      setLeaConversations(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setLeaConversations([]);
    } finally {
      setLeaConversationsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'lea') {
      loadLeaConversations();
    }
  }, [activeTab, transactionId]);

  const loadTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await transactionsAPI.get(parseInt(transactionId));
      if (response?.data) {
        setTransaction(response.data);
      } else {
        setError('Transaction introuvable');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement de la transaction');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour recharger la transaction sans masquer la page
  const reloadTransaction = async () => {
    try {
      const response = await transactionsAPI.get(parseInt(transactionId));
      if (response?.data) {
        setTransaction(response.data);
      }
      // Si la réponse est invalide, on garde la transaction actuelle
    } catch (err) {
      // En cas d'erreur, on garde la transaction actuelle
      console.error('Erreur lors du rechargement de la transaction:', err);
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

  // Calculate transaction steps (transaction is guaranteed to be non-null here)
  const steps = calculateTransactionSteps({
    ...transaction,
    sellers: transaction.sellers || [],
    buyers: transaction.buyers || [],
  });

  // Prix affiché : priorité final_sale_price > offered_price > listing_price
  const displayPrice =
    transaction.final_sale_price ?? transaction.offered_price ?? transaction.listing_price;
  const formatPrice = (amount?: number) =>
    amount != null
      ? new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(amount)
      : null;

  // Format expected closing date
  const formatExpectedClosing = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Format file size
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format timestamp for activity
  const formatTimestamp = (dateString?: string): string => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'steps', label: 'Étapes', icon: ClipboardList },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: MessageSquare },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
    { id: 'forms', label: 'Formulaire', icon: FileCheck },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'map', label: 'Carte', icon: MapPin },
    { id: 'lea', label: 'Léa', icon: Bot },
  ];

  // Filter documents
  const documents = transaction.documents?.filter(d => d.type !== 'photo') || [];
  const photos = transaction.documents?.filter(d => d.type === 'photo') || [];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button 
                onClick={() => router.push('/dashboard/transactions')}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">{transaction.name}</h1>
            </div>
            <p className="text-sm text-gray-500 ml-8">Transaction #{transaction.id}</p>
            {formatPrice(displayPrice) && (
              <p className="text-base font-semibold text-gray-900 ml-8 mt-1 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                {formatPrice(displayPrice)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-white rounded-2xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
              <Edit className="w-4 h-4 inline mr-2" />
              Edit
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-sm font-medium text-white hover:shadow-lg transition-shadow">
              <Send className="w-4 h-4 inline mr-2" />
              Send Update
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Transaction progress</h2>
              <p className="text-sm text-gray-500">Track all steps from initial contact to closing</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Expected closing</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatExpectedClosing(transaction.expected_closing_date)}
              </p>
            </div>
          </div>

          {/* StatusStepper with horizontal orientation */}
          <StatusStepper steps={steps} orientation="horizontal" />
        </div>

        {/* Main Content with Tabs */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      router.replace(`${pathname}?tab=${tab.id}`);
                    }}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </div>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Étapes Tab */}
            {activeTab === 'steps' && (
              <div className="min-h-[400px]">
                <TransactionStepsV2
                  transactionId={parseInt(transactionId, 10)}
                  onError={setError}
                  embedded
                />
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Transaction documents</h3>
                  <label className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4 inline mr-2" />
                    Upload Document
                    <input
                      type="file"
                      className="hidden"
                      onChange={async (e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile) {
                          try {
                            setSaving((prev) => ({ ...prev, documents: true }));
                            const response = await transactionsAPI.addDocument(
                              parseInt(transactionId),
                              selectedFile
                            );
                            if (response?.data) {
                              setTransaction(response.data);
                              showToast({
                                message: 'Document ajouté avec succès',
                                type: 'success',
                              });
                            } else {
                              // Recharger la transaction silencieusement si la réponse est invalide
                              await reloadTransaction();
                              showToast({
                                message: 'Document ajouté avec succès',
                                type: 'success',
                              });
                            }
                          } catch (err) {
                            showToast({
                              message: err instanceof Error ? err.message : 'Erreur lors de l\'ajout du document',
                              type: 'error',
                            });
                          } finally {
                            setSaving((prev) => ({ ...prev, documents: false }));
                            e.target.value = '';
                          }
                        }
                      }}
                      disabled={saving.documents}
                    />
                  </label>
                </div>

                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                          <p className="text-xs text-gray-500">
                            {doc.content_type || 'Document'} • {formatFileSize(doc.size)} • Uploaded {doc.uploaded_at ? formatTimestamp(doc.uploaded_at) : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          pending
                        </span>
                        <button 
                          onClick={() => window.open(doc.url, '_blank')}
                          className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Activity timeline</h3>
                </div>

                {/* Add Comment */}
                <div className="bg-gray-50 rounded-2xl p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none resize-none"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <Paperclip className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
                        <ImageIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        // TODO: Implement comment submission
                        setNewComment('');
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      <Send className="w-4 h-4 inline mr-2" />
                      Post Comment
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <TransactionTimeline transactionId={parseInt(transactionId)} />
                </div>
              </div>
            )}

            {/* Forms Tab */}
            {activeTab === 'forms' && (
              <div className="min-h-[400px]">
                <TransactionFormsTab transactionId={parseInt(transactionId)} />
              </div>
            )}

            {/* Contacts Tab */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Intervenants de la transaction</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddContactModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un contact
                  </button>
                </div>

                {contactsLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <Loading />
                  </div>
                ) : transactionContacts.length > 0 ? (
                  <div className="space-y-3">
                    {transactionContacts.map((tc) => (
                      <div
                        key={`${tc.contact_id}-${tc.role}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tc.contact.first_name} {tc.contact.last_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tc.role}
                              {tc.contact.company && ` · ${tc.contact.company}`}
                            </p>
                            {(tc.contact.email || tc.contact.phone) && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {tc.contact.email}
                                {tc.contact.email && tc.contact.phone && ' · '}
                                {tc.contact.phone}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Retirer ce contact de la transaction ?')) return;
                            try {
                              await realEstateContactsAPI.removeFromTransaction(
                                parseInt(transactionId),
                                tc.contact_id,
                                tc.role
                              );
                              await loadTransactionContacts();
                              showToast({ message: 'Contact retiré', type: 'success' });
                            } catch (err) {
                              showToast({
                                message: err instanceof Error ? err.message : 'Erreur',
                                type: 'error',
                              });
                            }
                          }}
                          className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500 hover:text-red-600"
                          title="Retirer de la transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">Aucun intervenant lié à cette transaction</p>
                    <button
                      type="button"
                      onClick={() => setShowAddContactModal(true)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Ajouter un contact
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Carte – Adresse sur la carte */}
            {activeTab === 'map' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Adresse du bien</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAddressForm({
                        property_address: transaction.property_address || '',
                        property_city: transaction.property_city || '',
                        property_postal_code: transaction.property_postal_code || '',
                        property_province: transaction.property_province || 'QC',
                      });
                      setShowEditAddressModal(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Modifier l&apos;adresse
                  </button>
                </div>
                {(() => {
                  const fullAddress = [
                    transaction.property_address,
                    transaction.property_city,
                    transaction.property_province,
                    transaction.property_postal_code,
                  ].filter(Boolean).join(', ');
                  if (!fullAddress) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-2">Aucune adresse enregistrée pour cette transaction</p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditAddressForm({
                              property_address: '',
                              property_city: '',
                              property_postal_code: '',
                              property_province: 'QC',
                            });
                            setShowEditAddressModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Ajouter une adresse
                        </button>
                      </div>
                    );
                  }
                  const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`;
                  const mapSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
                  return (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">{fullAddress}</p>
                      <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-100" style={{ minHeight: 400 }}>
                        <iframe
                          title="Carte de l'adresse"
                          src={mapUrl}
                          width="100%"
                          height="400"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                      <a
                        href={mapSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <MapPin className="w-4 h-4" />
                        Ouvrir dans Google Maps
                      </a>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Léa – Conversations liées à cette transaction */}
            {activeTab === 'lea' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Conversations Léa</h3>
                  <button
                    type="button"
                    onClick={() => router.push(`/${locale}/dashboard/lea2`)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    Nouvelle conversation avec Léa
                  </button>
                </div>

                {leaConversationsLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <Loading />
                  </div>
                ) : leaConversations.length > 0 ? (
                  <div className="space-y-3">
                    {leaConversations.map((c) => (
                      <div
                        key={c.session_id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{c.title}</p>
                            {c.updated_at && (
                              <p className="text-xs text-gray-500">{c.updated_at}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push(`/${locale}/dashboard/lea2?session=${encodeURIComponent(c.session_id)}`)}
                          className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          Ouvrir
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="mb-2">Aucune conversation Léa liée à cette transaction</p>
                    <p className="text-sm mb-4">Les conversations sont enregistrées lorsque vous parlez de cette transaction avec Léa.</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/${locale}/dashboard/lea2`)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Démarrer une conversation avec Léa
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Photos Tab */}
            {activeTab === 'photos' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Property photos</h3>
                  <label className="px-4 py-2 bg-blue-500 text-white rounded-2xl text-sm font-medium hover:bg-blue-600 transition-colors cursor-pointer">
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Photos
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const selectedFile = e.target.files?.[0];
                        if (selectedFile && transaction && transactionId) {
                          const previewUrl = URL.createObjectURL(selectedFile);
                          const tempPhotoId = Date.now();
                          const optimisticPhoto = {
                            id: tempPhotoId,
                            filename: selectedFile.name,
                            url: previewUrl,
                            size: selectedFile.size,
                            content_type: selectedFile.type || 'image/jpeg',
                            description: undefined,
                            uploaded_at: new Date().toISOString(),
                            uploaded_by: undefined,
                            type: 'photo' as const,
                          };
                          // Mise à jour optimiste immédiate : ajouter la photo à l'UI tout de suite
                          setTransaction((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              documents: [...(prev.documents || []), optimisticPhoto],
                            };
                          });
                          e.target.value = '';
                          try {
                            setSaving((prev) => ({ ...prev, photos: true }));
                            const id = parseInt(transactionId);
                            if (isNaN(id)) throw new Error('ID de transaction invalide');
                            const response = await transactionsAPI.addPhoto(id, selectedFile);
                            if (response?.data) {
                              const serverTransaction = response.data;
                              const serverPhotos = (serverTransaction.documents || []).filter((d: { type?: string }) => d.type === 'photo') || [];
                              const matchingPhoto = serverPhotos.find((p: { filename?: string; uploaded_at?: string }) =>
                                p.filename === selectedFile.name ||
                                (p.uploaded_at && new Date(p.uploaded_at).getTime() > Date.now() - 10000)
                              );
                              if (matchingPhoto) {
                                URL.revokeObjectURL(previewUrl);
                                setTransaction(serverTransaction);
                              } else {
                                setTransaction((prev) => {
                                  if (!prev) return serverTransaction;
                                  const serverDocsWithoutPhotos = (serverTransaction.documents || []).filter((d: { type?: string }) => d.type !== 'photo');
                                  const serverPhotosList = (serverTransaction.documents || []).filter((d: { type?: string }) => d.type === 'photo');
                                  return {
                                    ...serverTransaction,
                                    documents: [...serverDocsWithoutPhotos, ...serverPhotosList, optimisticPhoto],
                                  };
                                });
                              }
                              showToast({ message: 'Photo ajoutée avec succès', type: 'success' });
                            } else {
                              showToast({ message: 'Photo ajoutée avec succès', type: 'success' });
                            }
                          } catch (err) {
                            URL.revokeObjectURL(previewUrl);
                            setTransaction((prev) => {
                              if (!prev) return prev;
                              return { ...prev, documents: (prev.documents || []).filter((doc: { id?: number }) => doc.id !== tempPhotoId) };
                            });
                            showToast({ message: err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la photo', type: 'error' });
                          } finally {
                            setSaving((prev) => ({ ...prev, photos: false }));
                          }
                        }
                      }}
                      disabled={saving.photos}
                    />
                  </label>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6">
                    {photos.map((photo) => {
                      const isCover = transaction.cover_photo_id === photo.id;
                      return (
                      <div key={photo.id} className="group relative aspect-video rounded-2xl overflow-hidden">
                        {isCover && (
                          <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            Photo à la une
                          </div>
                        )}
                        <img
                          src={photo.url}
                          alt={photo.description || photo.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-4 right-4 flex gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                if (!transaction || !transactionId) return;
                                try {
                                  setSaving((prev) => ({ ...prev, [`cover-${photo.id}`]: true }));
                                  const id = parseInt(transactionId);
                                  if (isNaN(id)) return;
                                  const response = await transactionsAPI.update(id, {
                                    cover_photo_id: isCover ? null : photo.id,
                                  });
                                  if (response?.data) {
                                    setTransaction(response.data);
                                    showToast({
                                      message: isCover ? 'Photo à la une retirée' : 'Photo définie comme photo à la une',
                                      type: 'success',
                                    });
                                  }
                                } catch (err) {
                                  showToast({
                                    message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
                                    type: 'error',
                                  });
                                } finally {
                                  setSaving((prev) => ({ ...prev, [`cover-${photo.id}`]: false }));
                                }
                              }}
                              disabled={saving[`cover-${photo.id}`]}
                              className={`p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                isCover
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                  : 'bg-white/90 hover:bg-white text-gray-700'
                              }`}
                              title={isCover ? 'Retirer la photo à la une' : 'Définir comme photo à la une'}
                            >
                              <Star className={`w-4 h-4 ${isCover ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={async () => {
                                if (!transaction || !transactionId) return;
                                if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) return;
                                const photoIdToRemove = photo.id;
                                const previousDocuments = transaction.documents || [];
                                const previousCoverId = transaction.cover_photo_id;
                                setTransaction((prev) => {
                                  if (!prev) return prev;
                                  const nextDocs = (prev.documents || []).filter((d: { id?: number }) => d.id !== photoIdToRemove);
                                  return {
                                    ...prev,
                                    documents: nextDocs,
                                    cover_photo_id: prev.cover_photo_id === photoIdToRemove ? null : prev.cover_photo_id,
                                  };
                                });
                                try {
                                  setSaving((prev) => ({ ...prev, [`photo-${photoIdToRemove}`]: true }));
                                  const id = parseInt(transactionId);
                                  if (isNaN(id)) throw new Error('ID de transaction invalide');
                                  const response = await transactionsAPI.removeDocument(id, photoIdToRemove);
                                  if (response?.data) {
                                    setTransaction(response.data);
                                    showToast({ message: 'Photo supprimée avec succès', type: 'success' });
                                  } else {
                                    showToast({ message: 'Photo supprimée avec succès', type: 'success' });
                                  }
                                } catch (err) {
                                  setTransaction((prev) => {
                                    if (!prev) return prev;
                                    return { ...prev, documents: previousDocuments, cover_photo_id: previousCoverId };
                                  });
                                  showToast({
                                    message: err instanceof Error ? err.message : 'Erreur lors de la suppression de la photo',
                                    type: 'error',
                                  });
                                } finally {
                                  setSaving((prev) => ({ ...prev, [`photo-${photoIdToRemove}`]: false }));
                                }
                              }}
                              disabled={saving[`photo-${photo.id}`]}
                              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Supprimer la photo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4">
                            <p className="text-white font-medium">{photo.description || photo.filename}</p>
                          </div>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No photos uploaded yet</p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Modal: Add contact to transaction */}
        <AddContactToTransactionModal
          isOpen={showAddContactModal}
          onClose={() => setShowAddContactModal(false)}
          transactionId={parseInt(transactionId)}
          onContactAdded={() => {
            loadTransactionContacts();
            setShowAddContactModal(false);
            showToast({ message: 'Contact ajouté à la transaction', type: 'success' });
          }}
        />

        {/* Modal: Modifier l'adresse */}
        {showEditAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Modifier l&apos;adresse</h3>
              <div className="space-y-4">
                <AddressAutocompleteInput
                  label="Adresse complète"
                  value={editAddressForm.property_address}
                  onChange={(v) => setEditAddressForm((prev) => ({ ...prev, property_address: v }))}
                  onSelect={(result: AddressResult) => {
                    setEditAddressForm((prev) => ({
                      ...prev,
                      property_address: result.address,
                      property_city: result.city ?? prev.property_city,
                      property_postal_code: result.postal_code ?? prev.property_postal_code,
                      property_province: result.province ?? prev.property_province,
                    }));
                  }}
                  placeholder="Rechercher une adresse (Google)"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Ville"
                    value={editAddressForm.property_city}
                    onChange={(e) => setEditAddressForm((prev) => ({ ...prev, property_city: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Code postal"
                    value={editAddressForm.property_postal_code}
                    onChange={(e) => setEditAddressForm((prev) => ({ ...prev, property_postal_code: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Province (ex. QC)"
                  value={editAddressForm.property_province}
                  onChange={(e) => setEditAddressForm((prev) => ({ ...prev, property_province: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowEditAddressModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={editAddressSaving}
                  onClick={async () => {
                    try {
                      setEditAddressSaving(true);
                      const id = parseInt(transactionId, 10);
                      const response = await transactionsAPI.update(id, {
                        property_address: editAddressForm.property_address || undefined,
                        property_city: editAddressForm.property_city || undefined,
                        property_postal_code: editAddressForm.property_postal_code || undefined,
                        property_province: editAddressForm.property_province || undefined,
                      });
                      if (response?.data) setTransaction(response.data);
                      else await reloadTransaction();
                      setShowEditAddressModal(false);
                      showToast({ message: 'Adresse mise à jour', type: 'success' });
                    } catch (err) {
                      showToast({
                        message: err instanceof Error ? err.message : 'Erreur lors de la mise à jour',
                        type: 'error',
                      });
                    } finally {
                      setEditAddressSaving(false);
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {editAddressSaving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
