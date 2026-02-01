'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Search, ArrowLeft, File, Image as ImageIcon, FileSpreadsheet } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Doc {
  id: number;
  nom: string;
  type: string;
  categorie: string;
  taille: string | null;
  date_partage: string;
  partage_par_id: number;
  nouveau: boolean;
  url: string;
}

export default function DocumentsPage() {
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('tous');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const txRes = await apiClient.get<{ id: number }>('v1/portail/transactions/client');
        setTransactionId(txRes.data.id);
        const docsRes = await apiClient.get<Doc[]>(`v1/portail/transaction-documents/transaction/${txRes.data.id}`);
        setDocuments(Array.isArray(docsRes.data) ? docsRes.data : []);
      } catch {
        setTransactionId(null);
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = useMemo(
    () => ['tous', ...Array.from(new Set(documents.map((d) => d.categorie)))],
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchSearch =
        searchQuery === '' ||
        doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.categorie.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = filterCategorie === 'tous' || doc.categorie === filterCategorie;
      return matchSearch && matchCat;
    });
  }, [documents, searchQuery, filterCategorie]);

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'image':
      case 'jpg':
      case 'png':
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case 'excel':
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      default:
        return <File className="w-5 h-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!transactionId) {
    return (
      <div className="max-w-[1200px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction active</h2>
          <p className="text-gray-500">Les documents seront disponibles lorsqu'une transaction sera associée à votre compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-8 py-8">
      <Link
        href="/dashboard/portail-client/client"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
        <p className="text-sm text-gray-500">{documents.length} document(s) partagé(s)</p>
      </div>

      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl text-sm border border-gray-200 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategorie(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  filterCategorie === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                }`}
              >
                {cat === 'tous' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocuments.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-blue-200 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">{getTypeIcon(doc.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{doc.nom}</h3>
                  {doc.nouveau && (
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded">NOUVEAU</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{doc.categorie}</p>
                {doc.taille && <p className="text-xs text-gray-400 mt-0.5">{doc.taille}</p>}
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(doc.date_partage).toLocaleDateString('fr-CA')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucun document trouvé</p>
        </div>
      )}
    </div>
  );
}
