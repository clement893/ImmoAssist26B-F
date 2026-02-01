'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Container from '@/components/ui/Container';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { transactionsAPI } from '@/lib/api';
import TransactionTimeline from '@/components/transactions/TransactionTimeline';
import StatusStepper from '@/components/transactions/StatusStepper';
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


export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const transactionId = params.id as string;
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('documents');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadTransaction();
  }, [transactionId]);

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
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: MessageSquare },
    { id: 'photos', label: 'Photos', icon: ImageIcon },
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
                    onClick={() => setActiveTab(tab.id)}
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
                          // Capturer le nombre de photos avant l'ajout
                          const photosBeforeAdd = (transaction.documents || []).filter(d => d.type === 'photo').length;
                          
                          // Créer une URL d'aperçu immédiate
                          const previewUrl = URL.createObjectURL(selectedFile);
                          
                          // Mise à jour optimiste : ajouter la photo immédiatement à l'UI
                          const tempPhotoId = Date.now(); // ID temporaire
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
                          
                          // Mettre à jour la transaction immédiatement avec la photo optimiste
                          setTransaction((prev) => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              documents: [...(prev.documents || []), optimisticPhoto],
                            };
                          });
                          
                          try {
                            setSaving((prev) => ({ ...prev, photos: true }));
                            const id = parseInt(transactionId);
                            if (isNaN(id)) {
                              throw new Error('ID de transaction invalide');
                            }
                            
                            const response = await transactionsAPI.addPhoto(id, selectedFile);
                            
                            if (response?.data) {
                              const serverTransaction = response.data;
                              const serverPhotos = (serverTransaction.documents || []).filter((d: { type?: string }) => d.type === 'photo') || [];
                              
                              // Vérifier si le serveur a une nouvelle photo (plus de photos qu'avant)
                              const hasNewPhoto = serverPhotos.length > photosBeforeAdd;
                              
                              // Vérifier si une photo correspond au fichier uploadé (même nom ou timestamp récent)
                              const matchingPhoto = serverPhotos.find((p: { filename?: string; uploaded_at?: string }) => 
                                p.filename === selectedFile.name || 
                                (p.uploaded_at && new Date(p.uploaded_at).getTime() > Date.now() - 5000)
                              );
                              
                              if (hasNewPhoto && matchingPhoto) {
                                // Le serveur a confirmé la photo, remplacer l'optimiste par la vraie
                                URL.revokeObjectURL(previewUrl);
                                setTransaction(serverTransaction);
                              } else {
                                // Le serveur n'a pas encore confirmé la photo, garder l'optimiste
                                // Fusionner : garder la photo optimiste + tous les documents du serveur
                                setTransaction((prev) => {
                                  if (!prev) return serverTransaction;
                                  
                                  const optimisticPhoto = (prev.documents || []).find((doc: { id?: number }) => doc.id === tempPhotoId);
                                  if (!optimisticPhoto) {
                                    return serverTransaction;
                                  }
                                  
                                  // Garder tous les documents du serveur sauf les photos, puis ajouter les photos du serveur + l'optimiste
                                  const serverDocsWithoutPhotos = (serverTransaction.documents || []).filter((d: { type?: string }) => d.type !== 'photo');
                                  const existingServerPhotos = (serverTransaction.documents || []).filter((d: { type?: string }) => d.type === 'photo');
                                  
                                  return {
                                    ...serverTransaction,
                                    documents: [
                                      ...serverDocsWithoutPhotos,
                                      ...existingServerPhotos,
                                      optimisticPhoto, // Garder la photo optimiste en dernier pour qu'elle soit visible
                                    ],
                                  };
                                });
                                
                                // Ne PAS recharger automatiquement - laisser la photo optimiste visible
                                // L'utilisateur peut recharger manuellement si nécessaire, ou la photo sera chargée au prochain refresh de page
                              }
                              
                              showToast({
                                message: 'Photo ajoutée avec succès',
                                type: 'success',
                              });
                            } else {
                              // Réponse invalide mais on garde la photo optimiste visible
                              // Ne pas recharger pour éviter d'écraser la photo optimiste
                              showToast({
                                message: 'Photo ajoutée avec succès',
                                type: 'success',
                              });
                            }
                          } catch (err) {
                            // En cas d'erreur, retirer la photo optimiste et recharger
                            URL.revokeObjectURL(previewUrl);
                            setTransaction((prev) => {
                              if (!prev) return prev;
                              return {
                                ...prev,
                                documents: (prev.documents || []).filter(doc => doc.id !== tempPhotoId),
                              };
                            });
                            await reloadTransaction();
                            showToast({
                              message: err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la photo',
                              type: 'error',
                            });
                          } finally {
                            setSaving((prev) => ({ ...prev, photos: false }));
                            e.target.value = '';
                          }
                        }
                      }}
                      disabled={saving.photos}
                    />
                  </label>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-6">
                    {photos.map((photo) => (
                      <div key={photo.id} className="group relative aspect-video rounded-2xl overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.description || photo.filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute top-4 right-4">
                            <button
                              onClick={async () => {
                                if (!transaction || !transactionId) return;
                                
                                // Confirmation avant suppression
                                if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
                                  return;
                                }
                                
                                try {
                                  setSaving((prev) => ({ ...prev, [`photo-${photo.id}`]: true }));
                                  const id = parseInt(transactionId);
                                  if (isNaN(id)) {
                                    throw new Error('ID de transaction invalide');
                                  }
                                  const response = await transactionsAPI.removeDocument(id, photo.id);
                                  if (response?.data) {
                                    setTransaction(response.data);
                                    showToast({
                                      message: 'Photo supprimée avec succès',
                                      type: 'success',
                                    });
                                  } else {
                                    // Recharger la transaction silencieusement si la réponse est invalide
                                    await reloadTransaction();
                                    showToast({
                                      message: 'Photo supprimée avec succès',
                                      type: 'success',
                                    });
                                  }
                                } catch (err) {
                                  showToast({
                                    message: err instanceof Error ? err.message : 'Erreur lors de la suppression de la photo',
                                    type: 'error',
                                  });
                                } finally {
                                  setSaving((prev) => ({ ...prev, [`photo-${photo.id}`]: false }));
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
                    ))}
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
      </div>
    </div>
  );
}
