'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Download,
  Eye,
  Share2,
  Folder,
  Calendar,
  ArrowLeft,
  File,
  Image as ImageIcon,
  FileSpreadsheet,
} from 'lucide-react';

interface Document {
  id: string;
  nom: string;
  type: 'pdf' | 'image' | 'excel' | 'word';
  categorie: string;
  taille: string;
  date: string;
  partage_par: string;
  nouveau: boolean;
  url?: string;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('tous');

  const documents: Document[] = [
    {
      id: '1',
      nom: 'Offre d\'achat - 123 Rue Principale',
      type: 'pdf',
      categorie: 'Offres',
      taille: '2.4 MB',
      date: '2024-01-30',
      partage_par: 'Marie Dubois',
      nouveau: true,
    },
    {
      id: '2',
      nom: 'Déclaration du vendeur',
      type: 'pdf',
      categorie: 'Déclarations',
      taille: '1.8 MB',
      date: '2024-01-28',
      partage_par: 'Marie Dubois',
      nouveau: true,
    },
    {
      id: '3',
      nom: 'Rapport d\'inspection préliminaire',
      type: 'pdf',
      categorie: 'Inspections',
      taille: '5.2 MB',
      date: '2024-01-25',
      partage_par: 'Marie Dubois',
      nouveau: false,
    },
    {
      id: '4',
      nom: 'Photos de la propriété',
      type: 'image',
      categorie: 'Photos',
      taille: '12.5 MB',
      date: '2024-01-22',
      partage_par: 'Marie Dubois',
      nouveau: false,
    },
    {
      id: '5',
      nom: 'Évaluation municipale',
      type: 'pdf',
      categorie: 'Évaluations',
      taille: '890 KB',
      date: '2024-01-20',
      partage_par: 'Marie Dubois',
      nouveau: false,
    },
    {
      id: '6',
      nom: 'Contrat de courtage',
      type: 'pdf',
      categorie: 'Contrats',
      taille: '1.2 MB',
      date: '2024-01-15',
      partage_par: 'Marie Dubois',
      nouveau: false,
    },
    {
      id: '7',
      nom: 'Grille de comparaison',
      type: 'excel',
      categorie: 'Analyses',
      taille: '450 KB',
      date: '2024-01-18',
      partage_par: 'Marie Dubois',
      nouveau: false,
    },
    {
      id: '8',
      nom: 'Certificat de localisation',
      type: 'pdf',
      categorie: 'Certificats',
      taille: '3.1 MB',
      date: '2024-01-12',
      partage_par: 'Marie Dubois',
      nouveau: false,
    },
  ];

  const categories = ['tous', ...Array.from(new Set(documents.map((d) => d.categorie)))];

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        searchQuery === '' ||
        doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.categorie.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategorie = filterCategorie === 'tous' || doc.categorie === filterCategorie;

      return matchSearch && matchCategorie;
    });
  }, [documents, searchQuery, filterCategorie]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-purple-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'word':
        return <File className="w-5 h-5 text-blue-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFileColor = (type: string) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100';
      case 'image':
        return 'bg-purple-100';
      case 'excel':
        return 'bg-green-100';
      case 'word':
        return 'bg-blue-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <Link
            href="/fr/demo/portail-client/client"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Mes documents</h1>
                <p className="text-sm text-gray-500 font-light">
                  {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Filtres */}
          <div className="mt-6 bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un document..."
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Catégorie:</span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategorie(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterCategorie === cat
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat === 'tous' ? 'Tous' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 ${getFileColor(doc.type)} rounded-xl`}>
                    {getFileIcon(doc.type)}
                  </div>
                  {doc.nouveau && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-medium">
                      NOUVEAU
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                  {doc.nom}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Folder className="w-3.5 h-3.5" />
                    {doc.categorie}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(doc.date).toLocaleDateString('fr-CA')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="w-3.5 h-3.5" />
                    {doc.taille}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-3">
                    Partagé par <span className="font-medium text-gray-700">{doc.partage_par}</span>
                  </p>

                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors">
                      <Eye className="w-3.5 h-3.5" />
                      Voir
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-medium transition-colors">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Aucun document trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
