'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Tag,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Globe,
  Loader2,
  ExternalLink,
  BarChart3,
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
  // Métadonnées multilingues stockées dans fields
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

export default function FormulairesOACIQV2() {
  const [forms, setForms] = useState<OACIQForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'en'>('fr');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Charger les formulaires depuis l'API
  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Note: En production, cette URL devrait être configurée via env variables
        const apiUrl = '/api/v1/oaciq/forms';
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Pour inclure les cookies d'authentification
        });

        if (!response.ok) {
          throw new Error(`Erreur API: ${response.status}`);
        }

        const data = await response.json();
        setForms(data);
      } catch (err) {
        console.error('Erreur lors du chargement des formulaires:', err);
        setError('Impossible de charger les formulaires. Veuillez réessayer.');
        
        // Fallback: utiliser des données de démo si l'API échoue
        loadDemoForms();
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Charger des formulaires de démo en cas d'erreur API
  const loadDemoForms = () => {
    const demoForms: OACIQForm[] = [
      {
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
      {
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
      {
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
    ];
    setForms(demoForms);
  };

  // Statistics calculées dynamiquement
  const stats = useMemo(() => {
    const total = forms.length;
    const obligatoire = forms.filter(f => f.category === 'obligatoire').length;
    const recommandé = forms.filter(f => f.category === 'recommandé').length;
    const curateur_public = forms.filter(f => f.category === 'curateur_public').length;
    
    // Compter les types
    const types: Record<string, number> = {};
    forms.forEach(form => {
      const type = form.fields?.type || 'Autre';
      types[type] = (types[type] || 0) + 1;
    });

    return {
      total,
      obligatoire,
      recommandé,
      curateur_public,
      types,
    };
  }, [forms]);

  // Filtered forms
  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const nom_fr = form.fields?.nom_fr || form.name;
      const nom_en = form.fields?.nom_en || form.name;
      const code_fr = form.fields?.code_fr || form.code;
      const code_en = form.fields?.code_en || form.code;
      
      const matchesSearch =
        searchQuery === '' ||
        nom_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nom_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        code_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (form.description && form.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || form.category === selectedCategory;

      const matchesType = 
        selectedType === 'all' || form.fields?.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [forms, searchQuery, selectedCategory, selectedType]);

  // Get unique types for filter
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    forms.forEach(form => {
      if (form.fields?.type) {
        types.add(form.fields.type);
      }
    });
    return Array.from(types).sort();
  }, [forms]);

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

  // Get form name based on language
  const getFormName = (form: OACIQForm) => {
    if (selectedLanguage === 'fr') {
      return form.fields?.nom_fr || form.name;
    }
    return form.fields?.nom_en || form.name;
  };

  // Get form code based on language
  const getFormCode = (form: OACIQForm) => {
    if (selectedLanguage === 'fr') {
      return form.fields?.code_fr || form.code;
    }
    return form.fields?.code_en || form.code;
  };

  // Get PDF URL based on language
  const getPdfUrl = (form: OACIQForm) => {
    if (selectedLanguage === 'fr') {
      return form.fields?.pdf_fr_url || form.pdf_url;
    }
    return form.fields?.pdf_en_url || form.pdf_url;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-light">Chargement des formulaires OACIQ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-[1400px] mx-auto px-8 py-16">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
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
            
            <a
              href="https://www.oaciq.com/fr/formulaires"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-medium transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Site OACIQ
            </a>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-200" />
                <p className="text-sm text-yellow-100">{error}</p>
              </div>
            </div>
          )}

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

          <div className="flex items-center gap-3 flex-wrap">
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

            {availableTypes.length > 0 && (
              <>
                <span className="text-sm text-gray-500 font-medium ml-6">Type:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedType('all')}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      selectedType === 'all'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Tous
                  </button>
                  {availableTypes.slice(0, 4).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                        selectedType === type
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </>
            )}
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
              key={form.id}
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
                      <p className="text-xs font-mono text-gray-500">{getFormCode(form)}</p>
                      {form.version && (
                        <p className="text-xs text-gray-400">v{form.version}</p>
                      )}
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(
                      form.category
                    )}`}
                  >
                    {getCategoryIcon(form.category)}
                    {form.category}
                  </div>
                </div>

                <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                  {getFormName(form)}
                </h3>

                {form.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 font-light">
                    {form.description}
                  </p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                {form.fields?.type && (
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-600 font-medium">{form.fields.type}</span>
                  </div>
                )}

                {form.fields?.tags && form.fields.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {form.fields.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <a
                    href={getPdfUrl(form)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Voir
                  </a>
                  <a
                    href={getPdfUrl(form)}
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

        {/* Statistics Section */}
        {Object.keys(stats.types).length > 0 && (
          <div className="mt-8 bg-white rounded-3xl shadow-sm p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-50 rounded-xl">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Répartition par type
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(stats.types).map(([type, count]) => (
                <div key={type} className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-1">{type}</p>
                  <p className="text-2xl font-semibold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
