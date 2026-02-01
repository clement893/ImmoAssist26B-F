'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Tag,
  Calendar,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Globe,
} from 'lucide-react';

// Types
interface Form {
  code_fr: string;
  code_en: string;
  nom_fr: string;
  nom_en: string;
  description: string;
  categorie: 'obligatoire' | 'recommandé' | 'curateur_public';
  type: string;
  version: string;
  pdf_fr_url: string;
  pdf_en_url: string;
  tags: string[];
}

export default function FormulairesOACIQDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data - représente les 62 formulaires importés
  const forms: Form[] = [
    {
      code_fr: 'AOS',
      code_en: 'AOS',
      nom_fr: 'Annexe – Offre de service',
      nom_en: 'Annex – Offer of service',
      description: 'Formulaire annexe pour l\'offre de service immobilier',
      categorie: 'obligatoire',
      type: 'Annexe',
      version: '2024',
      pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/AOS.pdf',
      pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/AOS.pdf',
      tags: ['offre', 'service', 'obligatoire'],
    },
    {
      code_fr: 'DIA',
      code_en: 'DIA',
      nom_fr: 'Déclaration du courtier immobilier sur l\'immeuble',
      nom_en: 'Real estate broker\'s declaration on the immovable',
      description: 'Déclaration obligatoire du courtier concernant l\'immeuble',
      categorie: 'obligatoire',
      type: 'Déclaration',
      version: '2024',
      pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/DIA.pdf',
      pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/DIA.pdf',
      tags: ['déclaration', 'immeuble', 'obligatoire'],
    },
    {
      code_fr: 'PAI',
      code_en: 'PPI',
      nom_fr: 'Promesse d\'achat – Immeuble',
      nom_en: 'Promise to Purchase – Immovable',
      description: 'Promesse d\'achat pour un immeuble résidentiel',
      categorie: 'obligatoire',
      type: 'Promesse d\'achat',
      version: '2024',
      pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/PAI.pdf',
      pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/PPI.pdf',
      tags: ['promesse', 'achat', 'immeuble', 'obligatoire'],
    },
    {
      code_fr: 'CVI',
      code_en: 'CVI',
      nom_fr: 'Contrat de vente – Immeuble',
      nom_en: 'Contract of Sale – Immovable',
      description: 'Contrat de vente pour un immeuble résidentiel',
      categorie: 'obligatoire',
      type: 'Contrat',
      version: '2024',
      pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/CVI.pdf',
      pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/CVI.pdf',
      tags: ['contrat', 'vente', 'immeuble', 'obligatoire'],
    },
    {
      code_fr: 'ACAI',
      code_en: 'ACAI',
      nom_fr: 'Annexe – Conditions d\'achat – Immeuble',
      nom_en: 'Annex – Conditions of Purchase – Immovable',
      description: 'Annexe pour les conditions d\'achat d\'un immeuble',
      categorie: 'recommandé',
      type: 'Annexe',
      version: '2024',
      pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/ACAI.pdf',
      pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/ACAI.pdf',
      tags: ['annexe', 'conditions', 'achat', 'recommandé'],
    },
    {
      code_fr: 'FIC',
      code_en: 'FIC',
      nom_fr: 'Formulaire d\'identification du client',
      nom_en: 'Client Identification Form',
      description: 'Formulaire pour l\'identification du client',
      categorie: 'obligatoire',
      type: 'Formulaire',
      version: '2024',
      pdf_fr_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/francais/FIC.pdf',
      pdf_en_url: 'https://immoassist.s3.us-east-2.amazonaws.com/formulaires_oaciq_pdf/anglais/FIC.pdf',
      tags: ['identification', 'client', 'obligatoire'],
    },
  ];

  // Statistics
  const stats = {
    total: 62,
    obligatoire: 27,
    recommandé: 29,
    curateur_public: 6,
    types: {
      Annexe: 18,
      Contrat: 12,
      Formulaire: 15,
      'Promesse d\'achat': 8,
      Avis: 6,
      Déclaration: 3,
    },
  };

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const matchesSearch =
        searchQuery === '' ||
        form.nom_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.nom_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.code_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || form.categorie === selectedCategory;

      const matchesType = selectedType === 'all' || form.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchQuery, selectedCategory, selectedType]);

  // Category badge color
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

  // Category icon
  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'obligatoire':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'recommandé':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'curateur_public':
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-4xl font-light mb-2">Formulaires OACIQ</h1>
              <p className="text-blue-100 text-lg font-light">
                Bibliothèque complète des formulaires officiels
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100 font-light">Total</span>
                <TrendingUp className="w-4 h-4 text-blue-200" />
              </div>
              <p className="text-3xl font-semibold">{stats.total}</p>
              <p className="text-xs text-blue-100 mt-1">Formulaires disponibles</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100 font-light">Obligatoires</span>
                <AlertCircle className="w-4 h-4 text-red-300" />
              </div>
              <p className="text-3xl font-semibold">{stats.obligatoire}</p>
              <p className="text-xs text-blue-100 mt-1">Formulaires requis</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100 font-light">Recommandés</span>
                <CheckCircle2 className="w-4 h-4 text-green-300" />
              </div>
              <p className="text-3xl font-semibold">{stats.recommandé}</p>
              <p className="text-xs text-blue-100 mt-1">Formulaires suggérés</p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-blue-100 font-light">Bilingue</span>
                <Globe className="w-4 h-4 text-blue-200" />
              </div>
              <p className="text-3xl font-semibold">100%</p>
              <p className="text-xs text-blue-100 mt-1">FR + EN disponibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-3xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un formulaire par nom, code ou description..."
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedLanguage(selectedLanguage === 'fr' ? 'en' : 'fr')}
                className="px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-sm font-medium text-gray-700 transition-colors flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                {selectedLanguage === 'fr' ? 'Français' : 'English'}
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <Filter className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 font-medium">Catégorie:</span>
            <div className="flex gap-2">
              {['all', 'obligatoire', 'recommandé', 'curateur_public'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            <span className="text-sm text-gray-500 font-medium ml-6">Type:</span>
            <div className="flex gap-2">
              {['all', 'Annexe', 'Contrat', 'Formulaire', 'Promesse d\'achat'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                    selectedType === type
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'Tous' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filteredForms.length}</span> formulaire
            {filteredForms.length > 1 ? 's' : ''} trouvé{filteredForms.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form) => (
            <div
              key={form.code_fr}
              className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-xl">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-gray-500">
                        {selectedLanguage === 'fr' ? form.code_fr : form.code_en}
                      </p>
                      <p className="text-xs text-gray-400">v{form.version}</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                      form.categorie
                    )}`}
                  >
                    {getCategoryIcon(form.categorie)}
                    {form.categorie}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                  {selectedLanguage === 'fr' ? form.nom_fr : form.nom_en}
                </h3>

                <p className="text-sm text-gray-500 line-clamp-2 font-light">
                  {form.description}
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-600 font-medium">{form.type}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {form.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={selectedLanguage === 'fr' ? form.pdf_fr_url : form.pdf_en_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </a>
                  <a
                    href={selectedLanguage === 'fr' ? form.pdf_fr_url : form.pdf_en_url}
                    download
                    className="flex items-center justify-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredForms.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun formulaire trouvé
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Essayez de modifier vos critères de recherche ou de filtrage pour trouver le
              formulaire que vous recherchez.
            </p>
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Sparkles className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Formulaires officiels OACIQ
              </h4>
              <p className="text-sm text-gray-600 font-light">
                Tous les formulaires sont conformes aux normes de l'Organisme d'autoréglementation
                du courtage immobilier du Québec (OACIQ). Disponibles en français et en anglais,
                ils sont mis à jour régulièrement pour respecter les dernières réglementations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
