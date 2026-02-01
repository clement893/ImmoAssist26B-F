/**
 * OACIQ Form Detail Page
 * Page affichant toutes les informations d'un formulaire spécifique avec actions disponibles
 */

'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import {
  ArrowLeft,
  FileText,
  Download,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Globe,
  Loader2,
  ExternalLink,
  Share2,
  Printer,
  BookOpen,
  Edit3,
  Upload,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { oaciqFormsAPI, type OACIQForm } from '@/lib/api/oaciq-forms';

// Extended type to match demo structure
interface ExtendedOACIQForm extends OACIQForm {
  description?: string;
  version?: string;
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

export default function FormDetailPage() {
  const params = useParams();
  const code = params.code as string;

  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');

  // Load form from API
  const { data: form, isLoading, error } = useQuery({
    queryKey: ['oaciq-form', code],
    queryFn: () => oaciqFormsAPI.getByCode(code),
    retry: 1,
    enabled: !!code,
  });

  // Fallback demo form if API fails
  const loadDemoForm = (): ExtendedOACIQForm | null => {
    const demoForms: Record<string, ExtendedOACIQForm> = {
      AOS: {
        id: 1,
        code: 'AOS',
        name: 'Annexe – Offre de service',
        description:
          "Ce formulaire est une annexe obligatoire à l'offre de service du courtier immobilier. Il précise les conditions particulières de la prestation de services et les engagements du courtier envers son client.",
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
          tags: ['offre', 'service', 'obligatoire', 'courtier'],
        },
      },
      DIA: {
        id: 2,
        code: 'DIA',
        name: 'Déclaration du courtier immobilier sur l\'immeuble',
        description:
          "Déclaration obligatoire que le courtier doit remplir concernant l'état et les caractéristiques de l'immeuble. Ce document permet d'informer l'acheteur de tous les éléments importants relatifs à la propriété.",
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
          tags: ['déclaration', 'immeuble', 'obligatoire', 'état'],
        },
      },
      PAI: {
        id: 3,
        code: 'PAI',
        name: 'Promesse d\'achat – Immeuble',
        description:
          "Formulaire de promesse d'achat pour un immeuble résidentiel. Ce document engage l'acheteur à acquérir la propriété selon les conditions spécifiées et constitue une offre formelle au vendeur.",
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
          tags: ['promesse', 'achat', 'immeuble', 'obligatoire', 'offre'],
        },
      },
    };

    return demoForms[code] || demoForms['AOS'] || null;
  };

  // Use demo form if API fails
  const displayForm = useMemo(() => {
    if (error && !form) {
      return loadDemoForm();
    }
    return (form || null) as ExtendedOACIQForm | null;
  }, [form, error, code]);

  const getCategoryColor = (categorie: string) => {
    switch (categorie) {
      case 'obligatoire':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'recommandé':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'curateur_public':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'obligatoire':
        return <AlertCircle className="w-4 h-4" />;
      case 'recommandé':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'curateur_public':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

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
    if (selectedLanguage === 'fr') {
      return displayForm.fields?.pdf_fr_url || displayForm.pdf_url || '';
    }
    return displayForm.fields?.pdf_en_url || displayForm.pdf_url || '';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: getFormName(),
        url: window.location.href,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-light">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  if (!displayForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Formulaire introuvable</h2>
          <p className="text-sm text-gray-500 mb-6">Le formulaire demandé n'existe pas.</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <Link
            href="/dashboard/modules/formulaire/oaciq"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-semibold text-gray-900">{getFormName()}</h1>
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(
                        displayForm.category
                      )}`}
                    >
                      {getCategoryIcon(displayForm.category)}
                      {displayForm.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-mono">{getFormCode()}</span>
                    {displayForm.version && <span>Version {displayForm.version}</span>}
                    {displayForm.fields?.type && (
                      <>
                        <span>•</span>
                        <span>{displayForm.fields.type}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {displayForm.description && (
                <p className="text-sm text-gray-600 font-light max-w-3xl">
                  {displayForm.description}
                </p>
              )}
            </div>

            <button
              onClick={() => setSelectedLanguage(selectedLanguage === 'fr' ? 'en' : 'fr')}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors flex items-center gap-2 border border-gray-200"
            >
              <Globe className="w-4 h-4" />
              {selectedLanguage === 'fr' ? 'Français' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Actions & Info */}
          <div className="col-span-1 space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>

              <div className="space-y-3">
                <Link
                  href={`/dashboard/modules/formulaire/oaciq/${getFormCode()}/fill`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Compléter le formulaire
                </Link>

                <Link
                  href={`/dashboard/modules/formulaire/oaciq/${getFormCode()}/import-pdf`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Importer un PDF
                </Link>

                <Link
                  href={`/dashboard/modules/formulaire/oaciq/${getFormCode()}/view`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Visualiser le PDF
                </Link>

                <a
                  href={getPdfUrl()}
                  download
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Télécharger
                </a>

                <button
                  onClick={handlePrint}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200"
                >
                  <Share2 className="w-4 h-4" />
                  Partager
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Code</p>
                  <p className="text-sm font-mono text-gray-900">{getFormCode()}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">Catégorie</p>
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getCategoryColor(
                      displayForm.category
                    )}`}
                  >
                    {getCategoryIcon(displayForm.category)}
                    {displayForm.category}
                  </div>
                </div>

                {displayForm.fields?.type && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Type</p>
                    <p className="text-sm text-gray-900">{displayForm.fields.type}</p>
                  </div>
                )}

                {displayForm.version && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Version</p>
                    <p className="text-sm text-gray-900">{displayForm.version}</p>
                  </div>
                )}

                <div>
                  <p className="text-xs text-gray-500 mb-1">Langues disponibles</p>
                  <div className="flex gap-2">
                    {displayForm.fields?.pdf_fr_url && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        Français
                      </span>
                    )}
                    {displayForm.fields?.pdf_en_url && (
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        English
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags Card */}
            {displayForm.fields?.tags && displayForm.fields.tags.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {displayForm.fields.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* OACIQ Link */}
            <a
              href="https://www.oaciq.com/fr/formulaires"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors border border-gray-200"
            >
              <ExternalLink className="w-4 h-4" />
              Voir sur OACIQ.com
            </a>
          </div>

          {/* Right Column - Description & Preview */}
          <div className="col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Description détaillée</h3>
              </div>

              {displayForm.description ? (
                <p className="text-sm text-gray-600 font-light leading-relaxed">
                  {displayForm.description}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Aucune description détaillée disponible pour ce formulaire.
                </p>
              )}
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Aperçu du document</h3>

              <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-4">
                  Document PDF disponible en {selectedLanguage === 'fr' ? 'français' : 'anglais'}
                </p>
                <Link
                  href={`/dashboard/modules/formulaire/oaciq/${getFormCode()}/view`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Ouvrir le visualiseur
                </Link>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    Formulaire officiel OACIQ
                  </h4>
                  <p className="text-sm text-gray-600 font-light">
                    Ce formulaire est conforme aux normes de l'Organisme d'autoréglementation
                    du courtage immobilier du Québec (OACIQ). Assurez-vous d'utiliser la version
                    la plus récente pour vos transactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
