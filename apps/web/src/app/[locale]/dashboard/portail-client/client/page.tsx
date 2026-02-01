'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  MessageSquare,
  CheckCircle2,
  Calendar,
  MapPin,
  DollarSign,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface Transaction {
  id: number;
  type: string;
  statut: string;
  progression: number;
  adresse?: string;
  ville?: string;
  prix_offert?: number;
  prix_accepte?: number;
}

export default function PortailClientDashboard() {
  const { user } = useAuthStore();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get<Transaction>('v1/portail/transactions/client');
        setTransaction(res.data);
      } catch {
        setTransaction(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, []);

  const prenom = user?.name?.split(' ')[0] || 'Client';
  const typeProjet = transaction?.type || 'achat';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Bonjour {prenom} 👋</h1>
          <p className="text-sm text-gray-500 font-light">
            Voici un aperçu de votre projet {typeProjet === 'achat' ? "d'achat" : typeProjet === 'vente' ? 'de vente' : 'de location'} immobilier
          </p>
        </div>

        {transaction ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Progression de la transaction</h2>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${transaction.progression}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{transaction.progression}% complété</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Propriété actuelle</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  {(transaction.adresse || transaction.ville) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {[transaction.adresse, transaction.ville].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {(transaction.prix_accepte ?? transaction.prix_offert) && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {Number(transaction.prix_accepte ?? transaction.prix_offert).toLocaleString('fr-CA')} $
                    </div>
                  )}
                  {!transaction.adresse && !transaction.ville && !transaction.prix_accepte && !transaction.prix_offert && (
                    <p className="text-gray-500">Aucune propriété associée pour le moment.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Link
                href="/dashboard/portail-client/client/documents"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-colors"
              >
                <FileText className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl font-semibold text-gray-900">Documents</p>
                <p className="text-sm text-gray-500">Voir les documents partagés</p>
              </Link>
              <Link
                href="/dashboard/portail-client/client/messages"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-colors"
              >
                <MessageSquare className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl font-semibold text-gray-900">Messagerie</p>
                <p className="text-sm text-gray-500">Échanger avec votre courtier</p>
              </Link>
              <Link
                href="/dashboard/portail-client/client/taches"
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-colors"
              >
                <CheckCircle2 className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl font-semibold text-gray-900">Tâches</p>
                <p className="text-sm text-gray-500">Suivre vos tâches</p>
              </Link>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <Calendar className="w-8 h-8 text-blue-600 mb-3" />
                <p className="text-2xl font-semibold text-gray-900">Calendrier</p>
                <p className="text-sm text-gray-500">Bientôt disponible</p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction active</h2>
            <p className="text-gray-500 mb-6">
              Votre courtier n'a pas encore associé de transaction à votre compte. Vous serez notifié dès qu'un projet sera créé.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/dashboard/portail-client/client/documents"
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
              >
                Documents
              </Link>
              <Link
                href="/dashboard/portail-client/client/messages"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Messagerie
              </Link>
              <Link
                href="/dashboard/portail-client/client/taches"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                Tâches
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
