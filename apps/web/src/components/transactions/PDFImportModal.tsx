'use client';

import { useState, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { transactionsAPI } from '@/lib/api';
import { Upload, FileText, X, Check, AlertCircle } from 'lucide-react';

interface PDFImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
}

interface ExtractedData {
  name?: string;
  dossier_number?: string;
  status?: string;
  property_address?: string;
  property_city?: string;
  property_postal_code?: string;
  property_type?: string;
  construction_year?: number;
  bedrooms?: number;
  bathrooms?: number;
  living_area_sqft?: number;
  living_area_sqm?: number;
  sellers?: Array<{ name?: string; address?: string; phone?: string; email?: string }>;
  buyers?: Array<{ name?: string; address?: string; phone?: string; email?: string }>;
  listing_price?: number;
  offered_price?: number;
  final_sale_price?: number;
  deposit_amount?: number;
  expected_closing_date?: string;
  promise_to_purchase_date?: string;
  inspection_date?: string;
  mortgage_amount?: number;
  mortgage_institution?: string;
  notes?: string;
}

interface AnalysisResult {
  extracted_data: ExtractedData;
  pdf_preview: string; // base64 image
  pdf_text: string;
  pdf_filename: string;
}

export default function PDFImportModal({ isOpen, onClose, onSuccess }: PDFImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont acceptés');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setAnalyzing(true);
    setError(null);

    try {
      const response = await transactionsAPI.analyzePDF(file);
      setAnalysisResult(response.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'analyse du PDF';
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!analysisResult) return;

    setValidating(true);
    try {
      // Convert extracted data to transaction format
      const transactionData = {
        name: analysisResult.extracted_data.name || 'Transaction importée',
        dossier_number: analysisResult.extracted_data.dossier_number,
        status: analysisResult.extracted_data.status || 'En cours',
        property_address: analysisResult.extracted_data.property_address,
        property_city: analysisResult.extracted_data.property_city,
        property_postal_code: analysisResult.extracted_data.property_postal_code,
        property_type: analysisResult.extracted_data.property_type,
        construction_year: analysisResult.extracted_data.construction_year,
        bedrooms: analysisResult.extracted_data.bedrooms,
        bathrooms: analysisResult.extracted_data.bathrooms,
        living_area_sqft: analysisResult.extracted_data.living_area_sqft,
        living_area_sqm: analysisResult.extracted_data.living_area_sqm,
        sellers: analysisResult.extracted_data.sellers || [],
        buyers: analysisResult.extracted_data.buyers || [],
        listing_price: analysisResult.extracted_data.listing_price,
        offered_price: analysisResult.extracted_data.offered_price,
        final_sale_price: analysisResult.extracted_data.final_sale_price,
        deposit_amount: analysisResult.extracted_data.deposit_amount,
        expected_closing_date: analysisResult.extracted_data.expected_closing_date,
        promise_to_purchase_date: analysisResult.extracted_data.promise_to_purchase_date,
        inspection_date: analysisResult.extracted_data.inspection_date,
        mortgage_amount: analysisResult.extracted_data.mortgage_amount,
        mortgage_institution: analysisResult.extracted_data.mortgage_institution,
        notes: analysisResult.extracted_data.notes,
      };

      // Create transaction
      const createResponse = await transactionsAPI.create(transactionData);
      const createdTransaction = createResponse.data;

      // Add PDF as document to the transaction
      if (file) {
        await transactionsAPI.addDocument(createdTransaction.id, file, 'Document source de la transaction');
      }

      onSuccess(createdTransaction);
      handleClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la transaction';
      setError(errorMessage);
    } finally {
      setValidating(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importer une transaction depuis un PDF"
      size="xl"
    >
      <div className="space-y-6">
        {/* File Upload */}
        {!analysisResult && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Sélectionner un fichier PDF
              </label>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                />
                <label
                  htmlFor="pdf-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>{file ? file.name : 'Choisir un fichier PDF'}</span>
                </label>
                {file && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex items-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loading className="w-4 h-4" />
                        Analyse en cours...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        Analyser le PDF
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="error">
                <AlertCircle className="w-4 h-4" />
                {error}
              </Alert>
            )}
          </div>
        )}

        {/* Analysis Results and Validation */}
        {analysisResult && (
          <div className="space-y-6">
            <Alert variant="info">
              <FileText className="w-4 h-4" />
              Analyse terminée. Veuillez vérifier les informations extraites ci-dessous.
            </Alert>

            {/* PDF Preview */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Aperçu du PDF
              </label>
              <div className="border border-border rounded-lg p-4 bg-muted/50 max-h-96 overflow-auto">
                {analysisResult.pdf_preview && (
                  <img
                    src={`data:image/png;base64,${analysisResult.pdf_preview}`}
                    alt="PDF Preview"
                    className="max-w-full h-auto"
                  />
                )}
              </div>
            </div>

            {/* Extracted Data */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Données extraites
              </label>
              <div className="border border-border rounded-lg p-4 space-y-4 max-h-96 overflow-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Nom de la transaction</label>
                    <p className="font-medium">{analysisResult.extracted_data.name || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Numéro de dossier</label>
                    <p className="font-medium">{analysisResult.extracted_data.dossier_number || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Statut</label>
                    <p className="font-medium">{analysisResult.extracted_data.status || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Adresse</label>
                    <p className="font-medium">{analysisResult.extracted_data.property_address || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Ville</label>
                    <p className="font-medium">{analysisResult.extracted_data.property_city || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Code postal</label>
                    <p className="font-medium">{analysisResult.extracted_data.property_postal_code || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Type de propriété</label>
                    <p className="font-medium">{analysisResult.extracted_data.property_type || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Chambres / Salles de bain</label>
                    <p className="font-medium">
                      {analysisResult.extracted_data.bedrooms || '-'} / {analysisResult.extracted_data.bathrooms || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Prix demandé</label>
                    <p className="font-medium">
                      {analysisResult.extracted_data.listing_price
                        ? `$${analysisResult.extracted_data.listing_price.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Prix offert</label>
                    <p className="font-medium">
                      {analysisResult.extracted_data.offered_price
                        ? `$${analysisResult.extracted_data.offered_price.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Prix final</label>
                    <p className="font-medium">
                      {analysisResult.extracted_data.final_sale_price
                        ? `$${analysisResult.extracted_data.final_sale_price.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Date de clôture prévue</label>
                    <p className="font-medium">{analysisResult.extracted_data.expected_closing_date || '-'}</p>
                  </div>
                </div>

                {/* Sellers */}
                {analysisResult.extracted_data.sellers && analysisResult.extracted_data.sellers.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground">Vendeurs</label>
                    <div className="space-y-2 mt-1">
                      {analysisResult.extracted_data.sellers.map((seller, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium">{seller.name || '-'}</p>
                          {seller.address && <p className="text-muted-foreground">{seller.address}</p>}
                          {seller.phone && <p className="text-muted-foreground">{seller.phone}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyers */}
                {analysisResult.extracted_data.buyers && analysisResult.extracted_data.buyers.length > 0 && (
                  <div>
                    <label className="text-xs text-muted-foreground">Acheteurs</label>
                    <div className="space-y-2 mt-1">
                      {analysisResult.extracted_data.buyers.map((buyer, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium">{buyer.name || '-'}</p>
                          {buyer.address && <p className="text-muted-foreground">{buyer.address}</p>}
                          {buyer.phone && <p className="text-muted-foreground">{buyer.phone}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="error">
                <AlertCircle className="w-4 h-4" />
                {error}
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysisResult(null);
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                disabled={validating}
              >
                <X className="w-4 h-4 mr-2" />
                Réanalyser
              </Button>
              <Button
                onClick={handleApprove}
                disabled={validating || !analysisResult.extracted_data.name}
                className="flex items-center gap-2"
              >
                {validating ? (
                  <>
                    <Loading className="w-4 h-4" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Approuver et créer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
