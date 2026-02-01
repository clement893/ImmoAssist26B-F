'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface Tache {
  id: string;
  titre: string;
  description: string;
  priorite: 'haute' | 'moyenne' | 'basse';
  echeance: string;
  completee: boolean;
  categorie: string;
}

export default function TachesPage() {
  const [filterStatut, setFilterStatut] = useState<'toutes' | 'actives' | 'completees'>('actives');
  const [filterPriorite, setFilterPriorite] = useState<string>('toutes');

  const [taches, setTaches] = useState<Tache[]>([
    {
      id: '1',
      titre: 'Fournir les documents bancaires',
      description: 'Envoyer les 3 derniers relevés bancaires et la preuve d\'emploi à la banque',
      priorite: 'haute',
      echeance: '2024-02-03',
      completee: false,
      categorie: 'Financement',
    },
    {
      id: '2',
      titre: 'Confirmer la date d\'inspection',
      description: 'Appeler l\'inspecteur pour confirmer le rendez-vous du 5 février à 14h',
      priorite: 'haute',
      echeance: '2024-02-02',
      completee: false,
      categorie: 'Inspection',
    },
    {
      id: '3',
      titre: 'Réviser l\'offre d\'achat',
      description: 'Lire attentivement l\'offre d\'achat et noter vos questions',
      priorite: 'moyenne',
      echeance: '2024-02-04',
      completee: false,
      categorie: 'Documents',
    },
    {
      id: '4',
      titre: 'Contacter l\'assureur',
      description: 'Obtenir une soumission d\'assurance habitation pour la nouvelle propriété',
      priorite: 'basse',
      echeance: '2024-02-10',
      completee: false,
      categorie: 'Assurances',
    },
    {
      id: '5',
      titre: 'Préparer les questions pour l\'inspection',
      description: 'Faire une liste des questions à poser à l\'inspecteur',
      priorite: 'moyenne',
      echeance: '2024-02-05',
      completee: false,
      categorie: 'Inspection',
    },
    {
      id: '6',
      titre: 'Rencontrer le notaire',
      description: 'Prendre rendez-vous avec le notaire pour la signature',
      priorite: 'basse',
      echeance: '2024-02-15',
      completee: false,
      categorie: 'Légal',
    },
    {
      id: '7',
      titre: 'Signer le contrat de courtage',
      description: 'Signature du contrat avec Marie Dubois',
      priorite: 'haute',
      echeance: '2024-01-15',
      completee: true,
      categorie: 'Documents',
    },
    {
      id: '8',
      titre: 'Visite de la propriété',
      description: 'Première visite de la propriété au 123 Rue Principale',
      priorite: 'haute',
      echeance: '2024-01-20',
      completee: true,
      categorie: 'Visites',
    },
  ]);

  const filteredTaches = useMemo(() => {
    return taches.filter((tache) => {
      const matchStatut =
        filterStatut === 'toutes' ||
        (filterStatut === 'actives' && !tache.completee) ||
        (filterStatut === 'completees' && tache.completee);

      const matchPriorite =
        filterPriorite === 'toutes' || tache.priorite === filterPriorite;

      return matchStatut && matchPriorite;
    });
  }, [taches, filterStatut, filterPriorite]);

  const handleToggleTache = (id: string) => {
    setTaches(
      taches.map((t) => (t.id === id ? { ...t, completee: !t.completee } : t))
    );
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case 'haute':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'moyenne':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'basse':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isEcheanceProche = (echeance: string) => {
    const diff = new Date(echeance).getTime() - new Date().getTime();
    const jours = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return jours <= 3 && jours >= 0;
  };

  const isEcheanceDepassee = (echeance: string) => {
    return new Date(echeance) < new Date();
  };

  const stats = {
    total: taches.length,
    actives: taches.filter((t) => !t.completee).length,
    completees: taches.filter((t) => t.completee).length,
    en_retard: taches.filter((t) => !t.completee && isEcheanceDepassee(t.echeance)).length,
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

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <CheckCircle2 className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Mes tâches</h1>
                <p className="text-sm text-gray-500 font-light">
                  {stats.actives} tâche{stats.actives > 1 ? 's' : ''} active{stats.actives > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
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
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs text-red-600 mb-1">En retard</p>
              <p className="text-2xl font-semibold text-red-700">{stats.en_retard}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Statut:</span>
              {['toutes', 'actives', 'completees'].map((statut) => (
                <button
                  key={statut}
                  onClick={() => setFilterStatut(statut as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatut === statut
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {statut.charAt(0).toUpperCase() + statut.slice(1)}
                </button>
              ))}

              <div className="h-4 w-px bg-gray-300 mx-2" />

              <span className="text-xs text-gray-500 font-medium">Priorité:</span>
              {['toutes', 'haute', 'moyenne', 'basse'].map((priorite) => (
                <button
                  key={priorite}
                  onClick={() => setFilterPriorite(priorite)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterPriorite === priorite
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {priorite.charAt(0).toUpperCase() + priorite.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des tâches */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="space-y-4">
          {filteredTaches.map((tache) => (
            <div
              key={tache.id}
              className={`bg-white rounded-2xl shadow-sm border transition-all ${
                tache.completee
                  ? 'border-gray-200 opacity-60'
                  : 'border-gray-100 hover:shadow-md'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => handleToggleTache(tache.id)}
                    className="mt-1 flex-shrink-0"
                  >
                    {tache.completee ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 hover:text-purple-600 transition-colors" />
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3
                          className={`text-base font-semibold mb-1 ${
                            tache.completee
                              ? 'text-gray-500 line-through'
                              : 'text-gray-900'
                          }`}
                        >
                          {tache.titre}
                        </h3>
                        <p
                          className={`text-sm ${
                            tache.completee ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {tache.description}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2 ml-4">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${getPrioriteColor(
                            tache.priorite
                          )}`}
                        >
                          {tache.priorite}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {tache.categorie}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                      <div
                        className={`flex items-center gap-2 text-sm ${
                          !tache.completee && isEcheanceDepassee(tache.echeance)
                            ? 'text-red-600 font-medium'
                            : !tache.completee && isEcheanceProche(tache.echeance)
                            ? 'text-yellow-600 font-medium'
                            : 'text-gray-500'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        {new Date(tache.echeance).toLocaleDateString('fr-CA')}
                        {!tache.completee && isEcheanceDepassee(tache.echeance) && (
                          <span className="text-xs">(En retard)</span>
                        )}
                        {!tache.completee && isEcheanceProche(tache.echeance) && (
                          <span className="text-xs">(Bientôt)</span>
                        )}
                      </div>

                      {!tache.completee && isEcheanceDepassee(tache.echeance) && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Action requise</span>
                        </div>
                      )}

                      {!tache.completee && isEcheanceProche(tache.echeance) && (
                        <div className="flex items-center gap-2 text-sm text-yellow-600">
                          <Clock className="w-4 h-4" />
                          <span className="text-xs font-medium">Échéance proche</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTaches.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Aucune tâche trouvée</p>
          </div>
        )}
      </div>
    </div>
  );
}
