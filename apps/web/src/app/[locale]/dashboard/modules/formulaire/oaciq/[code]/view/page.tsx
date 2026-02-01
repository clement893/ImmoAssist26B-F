/**
 * OACIQ Form Viewer Page
 * Page immersive en dark mode pour visualiser le PDF avec contrôles de zoom et actions rapides
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  AlertCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { oaciqFormsAPI } from '@/lib/api/oaciq-adapters';

// Type pour affichage (API snake_case ou démo)
interface DisplayForm {
  id?: number;
  code?: string;
  name?: string;
  category?: string;
  pdf_url?: string;
  pdfUrl?: string;
  description?: string;
  version?: string;
  created_at?: string;
  updated_at?: string;
  fields?: {
    code_fr?: string;
    code_en?: string;
    nom_fr?: string;
    nom_en?: string;
    pdf_fr_url?: string;
    pdf_en_url?: string;
    pdf_url?: string;
    type?: string;
    tags?: string[];
  };
}

export default function FormViewPage() {
  const params = useParams();
  const code = params.code as string;

  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  // Load form from API
  const { data: form, isLoading, error } = useQuery({
    queryKey: ['oaciq-form', code],
    queryFn: () => oaciqFormsAPI.getByCode(code),
    retry: 1,
    enabled: !!code,
  });

  // Fallback demo form if API fails
  const loadDemoForm = (): DisplayForm | null => {
    const demoForms: Record<string, DisplayForm & { created_at?: string; updated_at?: string }> = {
      AOS: {
        id: 1,
        code: 'AOS',
        name: 'Annexe – Offre de service',
        description: 'Formulaire annexe pour l\'offre de service immobilier',
        category: 'obligatoire',
        pdf_url:
          'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/AOS.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'AOS',
          code_en: 'AOS',
          nom_fr: 'Annexe – Offre de service',
          nom_en: 'Annex – Offer of service',
          pdf_fr_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/AOS.pdf',
          pdf_en_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/AOS.pdf',
          type: 'Annexe',
          tags: ['offre', 'service', 'obligatoire'],
        },
      },
      DIA: {
        id: 2,
        code: 'DIA',
        name: 'Déclaration du courtier immobilier sur l\'immeuble',
        description: 'Déclaration obligatoire du courtier concernant l\'immeuble',
        category: 'obligatoire',
        pdf_url:
          'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/DIA.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'DIA',
          code_en: 'DIA',
          nom_fr: 'Déclaration du courtier immobilier sur l\'immeuble',
          nom_en: 'Real estate broker\'s declaration on the immovable',
          pdf_fr_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/DIA.pdf',
          pdf_en_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/DIA.pdf',
          type: 'Déclaration',
          tags: ['déclaration', 'immeuble', 'obligatoire'],
        },
      },
      ACD: {
        id: 4,
        code: 'ACD',
        name: 'Annexe – Contrat de courtage – Curateur public',
        description: 'Formulaire annexe pour le contrat de courtage avec curateur public',
        category: 'curateur_public',
        pdf_url:
          'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/ACD.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'ACD',
          code_en: 'ACD',
          nom_fr: 'Annexe – Contrat de courtage – Curateur public',
          nom_en: 'Annex – Brokerage contract – Curator of Public Curatorship',
          pdf_fr_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/ACD.pdf',
          pdf_en_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/ACD.pdf',
          type: 'Annexe',
          tags: ['curateur', 'courtage', 'annexe'],
        },
      },
      PAI: {
        id: 3,
        code: 'PAI',
        name: 'Promesse d\'achat – Immeuble',
        description: 'Promesse d\'achat pour un immeuble résidentiel',
        category: 'obligatoire',
        pdf_url:
          'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/PAI.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'PAI',
          code_en: 'PPI',
          nom_fr: 'Promesse d\'achat – Immeuble',
          nom_en: 'Promise to Purchase – Immovable',
          pdf_fr_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/PAI.pdf',
          pdf_en_url:
            'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/PPI.pdf',
          type: 'Promesse d\'achat',
          tags: ['promesse', 'achat', 'immeuble', 'obligatoire'],
        },
      },
    };

    return demoForms[code] || demoForms['AOS'] || null;
  };

  // Use demo form if API fails
  const displayForm = useMemo((): DisplayForm | null => {
    if (error && !form) {
      return loadDemoForm();
    }
    return (form || null) as DisplayForm | null;
  }, [form, error, code]);

  // Load PDF via proxy (évite X-Frame-Options et CORS)
  useEffect(() => {
    if (!displayForm || !code) return;
    setPdfLoadError(null);
    let cancelled = false;
    oaciqFormsAPI.getPdfPreviewBlob(code, selectedLanguage).then(
      (blob: Blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
      },
      (err: unknown) => {
        if (!cancelled) {
          setPdfLoadError(err instanceof Error ? err.message : 'Erreur chargement PDF');
          setPdfBlobUrl(null);
        }
      }
    );
    return () => {
      cancelled = true;
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [code, selectedLanguage, displayForm]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const getFormName = () => {
    if (!displayForm) return '';
    if (selectedLanguage === 'fr') {
      return displayForm.fields?.nom_fr || displayForm.name;
    }
    return displayForm.fields?.nom_en || displayForm.name;
  };

  const getFormCode = () => {
    if (!displayForm) return '';
    if (selectedLanguage === 'fr') {
      return displayForm.fields?.code_fr || displayForm.code;
    }
    return displayForm.fields?.code_en || displayForm.code;
  };

  const getPdfUrl = () => {
    if (!displayForm) return '';
    const pdfUrl = displayForm.pdf_url || (displayForm as { pdfUrl?: string }).pdfUrl;
    if (selectedLanguage === 'fr') {
      return displayForm.fields?.pdf_fr_url || displayForm.fields?.pdf_url || pdfUrl || '';
    }
    return displayForm.fields?.pdf_en_url || pdfUrl || '';
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const url = pdfBlobUrl || getPdfUrl();
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getFormCode()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const iframe = document.getElementById('pdf-viewer') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: getFormName(),
        text: `Formulaire OACIQ: ${getFormName()}`,
        url: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-300 font-light">Chargement du PDF...</p>
        </div>
      </div>
    );
  }

  if (!displayForm) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Formulaire introuvable</h2>
          <p className="text-sm text-gray-400 mb-6">Le formulaire demandé n'existe pas.</p>
          <Link
            href="/dashboard/modules/formulaire/oaciq"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left - Navigation */}
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/modules/formulaire/oaciq/${getFormCode()}`}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Link>

              <div className="h-8 w-px bg-gray-700" />

              <div>
                <p className="text-sm font-medium text-white">{getFormName()}</p>
                <p className="text-xs text-gray-400 font-mono">{getFormCode()}</p>
              </div>
            </div>

            {/* Center - Zoom Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="px-3 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium min-w-[80px] text-center">
                {zoom}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 200}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center gap-2">
              {/* Toggle langue */}
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === 'fr' ? 'en' : 'fr')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                <Globe className="w-4 h-4" />
                {selectedLanguage === 'fr' ? 'FR' : 'EN'}
              </button>

              <div className="h-8 w-px bg-gray-700" />

              {/* Actions rapides */}
              <button
                onClick={handleDownload}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Télécharger"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={handlePrint}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Imprimer"
              >
                <Printer className="w-4 h-4" />
              </button>

              <button
                onClick={handleShare}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Partager"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <div className="h-8 w-px bg-gray-700" />

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <a
                href={pdfBlobUrl || getPdfUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer - pleine largeur, scroll vertical dans l'iframe */}
      <div className="flex-1 flex flex-col bg-gray-900 min-h-0">
        {error && (
          <div className="flex-shrink-0 px-6 py-3">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-yellow-200">
                  Impossible de charger le formulaire depuis l'API. Utilisation des données de démo.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
          {pdfLoadError ? (
            <div className="w-full flex-1 min-h-[400px] flex flex-col items-center justify-center gap-4 p-8 text-gray-500 bg-white">
              <AlertCircle className="w-12 h-12 text-amber-500" />
              <p className="text-sm">{pdfLoadError}</p>
              <a
                href={getPdfUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir le PDF dans un nouvel onglet
              </a>
            </div>
          ) : pdfBlobUrl ? (
            <div
              className="flex-1 min-h-0 overflow-auto w-full"
              style={{
                // Zoom: le conteneur est plus grand que la vue pour permettre le scroll
                width: `${Math.max(100, zoom)}%`,
                height: `${Math.max(100, zoom)}%`,
                minWidth: '100%',
                minHeight: 'calc(100vh - 180px)',
              }}
            >
              <iframe
                id="pdf-viewer"
                src={`${pdfBlobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                className="w-full border-0 bg-white block"
                style={{ height: '100%', minHeight: 'calc(100vh - 180px)' }}
                title={getFormName()}
              />
            </div>
          ) : (
            <div className="w-full flex-1 min-h-[400px] flex items-center justify-center bg-white">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Formulaire OACIQ officiel</span>
            {displayForm.version && (
              <>
                <span>•</span>
                <span>Version {displayForm.version}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span>Langue: {selectedLanguage === 'fr' ? 'Français' : 'English'}</span>
            <span>•</span>
            <span>Zoom: {zoom}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
