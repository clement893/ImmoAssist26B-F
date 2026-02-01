'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowLeft, Calendar, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Tache {
  id: number;
  transaction_id: number;
  titre: string;
  description: string | null;
  priorite: string;
  categorie: string;
  echeance: string;
  completee: boolean;
  date_completion: string | null;
  cree_par_id: number;
  date_creation: string;
}

export default function TachesPage() {
  const [transactionId, setTransactionId] = useState<number | null>(null);
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<'toutes' | 'actives' | 'completees'>('actives');
  const [filterPriorite, setFilterPriorite] = useState<string>('toutes');

  const fetchTaches = async () => {
    if (!transactionId) return;
    try {
      const res = await apiClient.get<Tache[]>(`v1/portail/transaction-taches/transaction/${transactionId}`);
      setTaches(Array.isArray(res.data) ? res.data : []);
    } catch {
      setTaches([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const txRes = await apiClient.get<{ id: number }>('v1/portail/transactions/client');
        setTransactionId(txRes.data.id);
        const res = await apiClient.get<Tache[]>(`v1/portail/transaction-taches/transaction/${txRes.data.id}`);
        setTaches(Array.isArray(res.data) ? res.data : []);
      } catch {
        setTransactionId(null);
        setTaches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTaches = useMemo(() => {
    return taches.filter((t) => {
      const matchStatut =
        filterStatut === 'toutes' ||
        (filterStatut === 'actives' && !t.completee) ||
        (filterStatut === 'completees' && t.completee);
      const matchPriorite = filterPriorite === 'toutes' || t.priorite === filterPriorite;
      return matchStatut && matchPriorite;
    });
  }, [taches, filterStatut, filterPriorite]);

  const handleToggle = async (tacheId: number) => {
    try {
      await apiClient.put(`v1/portail/transaction-taches/${tacheId}/toggle`);
      if (transactionId) {
        const res = await apiClient.get<Tache[]>(`v1/portail/transaction-taches/transaction/${transactionId}`);
        setTaches(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // ignore
    }
  };

  const stats = {
    total: taches.length,
    actives: taches.filter((t) => !t.completee).length,
    completees: taches.filter((t) => t.completee).length,
    enRetard: taches.filter((t) => !t.completee && new Date(t.echeance) < new Date()).length,
  };

  const getPrioriteColor = (p: string) => {
    switch (p) {
      case 'haute':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'moyenne':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
      <div className="max-w-[1000px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune transaction active</h2>
          <p className="text-gray-500">Les tâches seront disponibles lorsqu'une transaction sera associée à votre compte.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-8 py-8">
      <Link
        href="/dashboard/portail-client/client"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tâches</h1>
        <p className="text-sm text-gray-500">{stats.actives} active(s), {stats.completees} complétée(s)</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-600 mb-1">Actives</p>
          <p className="text-2xl font-semibold text-blue-700">{stats.actives}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4">
          <p className="text-xs text-green-600 mb-1">Complétées</p>
          <p className="text-2xl font-semibold text-green-700">{stats.completees}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4">
          <p className="text-xs text-amber-600 mb-1">En retard</p>
          <p className="text-2xl font-semibold text-amber-700">{stats.enRetard}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs text-gray-500 font-medium">Statut:</span>
        {(['actives', 'completees', 'toutes'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatut(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filterStatut === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {s === 'toutes' ? 'Toutes' : s === 'actives' ? 'Actives' : 'Complétées'}
          </button>
        ))}
        <span className="text-xs text-gray-500 font-medium ml-4">Priorité:</span>
        {['toutes', 'haute', 'moyenne', 'basse'].map((p) => (
          <button
            key={p}
            onClick={() => setFilterPriorite(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filterPriorite === p ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {p === 'toutes' ? 'Toutes' : p}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredTaches.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 ${
              t.completee ? 'opacity-75' : ''
            }`}
          >
            <button
              type="button"
              onClick={() => handleToggle(t.id)}
              className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-600"
            >
              {t.completee ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <Circle className="w-6 h-6" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium text-gray-900 ${t.completee ? 'line-through text-gray-500' : ''}`}>
                {t.titre}
              </h3>
              {t.description && (
                <p className="text-xs text-gray-500 mt-1">{t.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getPrioriteColor(t.priorite)}`}>
                  {t.priorite}
                </span>
                <span className="text-xs text-gray-400">{t.categorie}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(t.echeance).toLocaleDateString('fr-CA')}
                </span>
                {!t.completee && new Date(t.echeance) < new Date() && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Échéance dépassée
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTaches.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune tâche trouvée</p>
        </div>
      )}
    </div>
  );
}
