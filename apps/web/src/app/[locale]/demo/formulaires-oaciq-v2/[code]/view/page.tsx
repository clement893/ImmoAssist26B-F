'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Printer,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Globe,
  ExternalLink,
} from 'lucide-react';

// Types
interface OACIQForm {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: 'obligatoire' | 'recommandé' | 'curateur_public';
  pdf_url: string;
  version?: string;
  created_at: string;
  updated_at: string;
  fields?: {
    code_fr?: string;
    code_en?: string;
    nom_fr?: string;
    nom_en?: string;
    pdf_fr_url?: string;
    pdf_en_url?: string;
    type?: string;
    tags?: string[];
  };
}

export default function FormViewPage() {
  const params = useParams();
  const code = params.code as string;
  
  const [form, setForm] = useState<OACIQForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const apiUrl = `/api/v1/oaciq/forms/${code}`;
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        setForm(data);
      } catch (err) {
        console.error('Erreur lors du chargement du formulaire:', err);
        setError('Impossible de charger le formulaire. Utilisation des données de démo.');
        loadDemoForm();
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [code]);

  const loadDemoForm = () => {
    const demoForms: Record<string, OACIQForm> = {
      'AOS': {
        id: 1,
        code: 'AOS',
        name: 'Annexe – Offre de service',
        description: 'Formulaire annexe pour l\'offre de service immobilier',
        category: 'obligatoire',
        pdf_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/AOS.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'AOS',
          code_en: 'AOS',
          nom_fr: 'Annexe – Offre de service',
          nom_en: 'Annex – Offer of service',
          pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/AOS.pdf',
          pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/AOS.pdf',
          type: 'Annexe',
          tags: ['offre', 'service', 'obligatoire'],
        },
      },
      'DIA': {
        id: 2,
        code: 'DIA',
        name: 'Déclaration du courtier immobilier sur l\'immeuble',
        description: 'Déclaration obligatoire du courtier concernant l\'immeuble',
        category: 'obligatoire',
        pdf_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/DIA.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'DIA',
          code_en: 'DIA',
          nom_fr: 'Déclaration du courtier immobilier sur l\'immeuble',
          nom_en: 'Real estate broker\'s declaration on the immovable',
          pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/DIA.pdf',
          pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/DIA.pdf',
          type: 'Déclaration',
          tags: ['déclaration', 'immeuble', 'obligatoire'],
        },
      },
      'PAI': {
        id: 3,
        code: 'PAI',
        name: 'Promesse d\'achat – Immeuble',
        description: 'Promesse d\'achat pour un immeuble résidentiel',
        category: 'obligatoire',
        pdf_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/PAI.pdf',
        version: '2024',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        fields: {
          code_fr: 'PAI',
          code_en: 'PPI',
          nom_fr: 'Promesse d\'achat – Immeuble',
          nom_en: 'Promise to Purchase – Immovable',
          pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/PAI.pdf',
          pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/PPI.pdf',
          type: 'Promesse d\'achat',
          tags: ['promesse', 'achat', 'immeuble', 'obligatoire'],
        },
      },
    };
    
    setForm(demoForms[code] || demoForms['AOS']);
  };

  const getFormName = () => {
    if (!form) return '';
    if (selectedLanguage === 'fr') {
      return form.fields?.nom_fr || form.name;
    }
    return form.fields?.nom_en || form.name;
  };

  const getFormCode = () => {
    if (!form) return '';
    if (selectedLanguage === 'fr') {
      return form.fields?.code_fr || form.code;
    }
    return form.fields?.code_en || form.code;
  };

  const getPdfUrl = () => {
    if (!form) return '';
    if (selectedLanguage === 'fr') {
      return form.fields?.pdf_fr_url || form.pdf_url;
    }
    return form.fields?.pdf_en_url || form.pdf_url;
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
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
    const link = document.createElement('a');
    link.href = getPdfUrl();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-300 font-light">Chargement du PDF...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Formulaire introuvable</h2>
          <p className="text-sm text-gray-400 mb-6">Le formulaire demandé n'existe pas.</p>
          <Link
            href="/fr/demo/formulaires-oaciq-v2"
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
                href={`/fr/demo/formulaires-oaciq-v2/${getFormCode()}`}
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
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === 'fr' ? 'en' : 'fr')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
              >
                <Globe className="w-4 h-4" />
                {selectedLanguage === 'fr' ? 'FR' : 'EN'}
              </button>

              <div className="h-8 w-px bg-gray-700" />

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
                href={getPdfUrl()}
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

      {/* PDF Viewer */}
      <div className="flex-1 bg-gray-900 overflow-hidden">
        {error && (
          <div className="max-w-4xl mx-auto mt-8 px-6">
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <p className="text-sm text-yellow-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="h-full flex items-center justify-center p-6">
          <div 
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
            style={{ 
              width: `${zoom}%`, 
              height: '100%',
              maxWidth: '1200px',
              transition: 'width 0.3s ease'
            }}
          >
            <iframe
              id="pdf-viewer"
              src={`${getPdfUrl()}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full"
              title={getFormName()}
            />
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Formulaire OACIQ officiel</span>
            {form.version && (
              <>
                <span>•</span>
                <span>Version {form.version}</span>
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
