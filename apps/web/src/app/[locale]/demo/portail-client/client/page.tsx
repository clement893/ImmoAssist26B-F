'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  FileText,
  MessageSquare,
  CheckCircle2,
  Calendar,
  User,
  Bell,
  TrendingUp,
  Clock,
  AlertCircle,
  Download,
  Eye,
  ArrowRight,
  MapPin,
  DollarSign,
} from 'lucide-react';

export default function PortailClientDashboard() {
  const [client] = useState({
    prenom: 'Sophie',
    nom: 'Tremblay',
    type_projet: 'achat',
    statut_transaction: 'en_cours',
    progression: 65,
    courtier: {
      nom: 'Marie Dubois',
      email: 'marie.dubois@immoassist.com',
      telephone: '514-555-0100',
      photo: null,
    },
  });

  const stats = {
    documents: 12,
    messages_non_lus: 2,
    taches_en_cours: 4,
    prochains_rdv: 2,
  };

  const prochaines_etapes = [
    {
      id: 1,
      titre: 'Inspection de la propriété',
      date: '2024-02-05',
      heure: '14:00',
      statut: 'planifié',
      description: 'Inspection complète avec l\'inspecteur certifié',
    },
    {
      id: 2,
      titre: 'Signature de l\'offre d\'achat',
      date: '2024-02-08',
      heure: '10:00',
      statut: 'à_planifier',
      description: 'Rendez-vous avec le notaire pour la signature',
    },
    {
      id: 3,
      titre: 'Obtention du financement',
      date: '2024-02-15',
      heure: null,
      statut: 'en_cours',
      description: 'Finalisation du dossier avec la banque',
    },
  ];

  const documents_recents = [
    {
      id: 1,
      nom: 'Offre d\'achat - 123 Rue Principale',
      type: 'PDF',
      taille: '2.4 MB',
      date: '2024-01-30',
      nouveau: true,
    },
    {
      id: 2,
      nom: 'Déclaration du vendeur',
      type: 'PDF',
      taille: '1.8 MB',
      date: '2024-01-28',
      nouveau: true,
    },
    {
      id: 3,
      nom: 'Rapport d\'inspection préliminaire',
      type: 'PDF',
      taille: '5.2 MB',
      date: '2024-01-25',
      nouveau: false,
    },
  ];

  const messages_recents = [
    {
      id: 1,
      expediteur: 'Marie Dubois',
      message: 'J\'ai reçu la contre-offre du vendeur. Pouvons-nous en discuter?',
      date: '2024-02-01T10:30:00',
      lu: false,
    },
    {
      id: 2,
      expediteur: 'Marie Dubois',
      message: 'Les documents pour l\'inspection sont prêts.',
      date: '2024-01-31T15:45:00',
      lu: false,
    },
    {
      id: 3,
      expediteur: 'Marie Dubois',
      message: 'Confirmation de la visite pour demain à 14h.',
      date: '2024-01-30T09:20:00',
      lu: true,
    },
  ];

  const taches_actives = [
    {
      id: 1,
      titre: 'Fournir les documents bancaires',
      priorite: 'haute',
      echeance: '2024-02-03',
      completee: false,
    },
    {
      id: 2,
      titre: 'Confirmer la date d\'inspection',
      priorite: 'haute',
      echeance: '2024-02-02',
      completee: false,
    },
    {
      id: 3,
      titre: 'Réviser l\'offre d\'achat',
      priorite: 'moyenne',
      echeance: '2024-02-04',
      completee: false,
    },
    {
      id: 4,
      titre: 'Contacter l\'assureur',
      priorite: 'basse',
      echeance: '2024-02-10',
      completee: false,
    },
  ];

  const propriete_actuelle = {
    adresse: '123 Rue Principale',
    ville: 'Montréal',
    prix: '450 000',
    image: null,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Bonjour {client.prenom} 👋
              </h1>
              <p className="text-sm text-gray-500 font-light">
                Voici un aperçu de votre projet d'achat immobilier
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {stats.messages_non_lus > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              <Link
                href="/fr/demo/portail-client/client/profil"
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded-xl transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {client.prenom} {client.nom}
                  </p>
                  <p className="text-xs text-gray-500">Mon profil</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="grid grid-cols-3 gap-6">
          {/* Colonne principale (2/3) */}
          <div className="col-span-2 space-y-6">
            {/* Progression de la transaction */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-sm p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Votre projet d'achat</h2>
                  <p className="text-sm text-blue-100 font-light">En cours</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">{client.progression}%</p>
                  <p className="text-sm text-blue-100">Complété</p>
                </div>
              </div>

              <div className="bg-blue-400/30 rounded-full h-3 mb-4">
                <div
                  className="bg-white h-3 rounded-full transition-all"
                  style={{ width: `${client.progression}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-100">Recherche</span>
                <span className="text-blue-100">Offre</span>
                <span className="text-white font-medium">Inspection</span>
                <span className="text-blue-100">Financement</span>
                <span className="text-blue-100">Notaire</span>
              </div>
            </div>

            {/* Propriété actuelle */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <Home className="w-16 h-16 text-gray-400" />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {propriete_actuelle.adresse}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4" />
                      {propriete_actuelle.ville}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
                      <DollarSign className="w-6 h-6" />
                      {propriete_actuelle.prix}
                    </div>
                    <p className="text-xs text-gray-500">Prix offert</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link
                    href="/fr/demo/portail-client/client/proprietes/1"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Voir détails
                  </Link>
                  <Link
                    href="/fr/demo/portail-client/client/transaction"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Suivi transaction
                  </Link>
                </div>
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Prochaines étapes</h2>
                <Link
                  href="/fr/demo/portail-client/client/transaction"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              <div className="space-y-4">
                {prochaines_etapes.map((etape) => (
                  <div
                    key={etape.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-white rounded-lg">
                      {etape.statut === 'planifié' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {etape.statut === 'en_cours' && (
                        <Clock className="w-5 h-5 text-blue-600" />
                      )}
                      {etape.statut === 'à_planifier' && (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {etape.titre}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">{etape.description}</p>
                      {etape.date && (
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(etape.date).toLocaleDateString('fr-CA')}
                          </div>
                          {etape.heure && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {etape.heure}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="p-2 hover:bg-white rounded-lg transition-colors">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents récents */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Documents récents</h2>
                <Link
                  href="/fr/demo/portail-client/client/documents"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              <div className="space-y-3">
                {documents_recents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{doc.nom}</h4>
                        {doc.nouveau && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-medium">
                            NOUVEAU
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {doc.type} • {doc.taille} • {new Date(doc.date).toLocaleDateString('fr-CA')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="col-span-1 space-y-6">
            {/* Stats rapides */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/fr/demo/portail-client/client/documents"
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.documents}</span>
                </div>
                <p className="text-xs text-gray-500">Documents</p>
              </Link>

              <Link
                href="/fr/demo/portail-client/client/messages"
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.messages_non_lus}</span>
                </div>
                <p className="text-xs text-gray-500">Messages</p>
                {stats.messages_non_lus > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Link>

              <Link
                href="/fr/demo/portail-client/client/taches"
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.taches_en_cours}</span>
                </div>
                <p className="text-xs text-gray-500">Tâches</p>
              </Link>

              <Link
                href="/fr/demo/portail-client/client/calendrier"
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">{stats.prochains_rdv}</span>
                </div>
                <p className="text-xs text-gray-500">Rendez-vous</p>
              </Link>
            </div>

            {/* Courtier */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Votre courtier</h3>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{client.courtier.nom}</p>
                  <p className="text-xs text-gray-500">Courtier immobilier</p>
                </div>
              </div>

              <div className="space-y-3">
                <a
                  href={`mailto:${client.courtier.email}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Mail className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{client.courtier.email}</span>
                </a>

                <a
                  href={`tel:${client.courtier.telephone}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{client.courtier.telephone}</span>
                </a>
              </div>

              <Link
                href="/fr/demo/portail-client/client/messages"
                className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Envoyer un message
              </Link>
            </div>

            {/* Messages récents */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Messages récents</h3>
                <Link
                  href="/fr/demo/portail-client/client/messages"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              <div className="space-y-3">
                {messages_recents.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer ${
                      !msg.lu ? 'bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-900">{msg.expediteur}</p>
                      {!msg.lu && <span className="w-2 h-2 bg-blue-600 rounded-full" />}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{msg.message}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(msg.date).toLocaleString('fr-CA')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tâches actives */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Tâches à compléter</h3>
                <Link
                  href="/fr/demo/portail-client/client/taches"
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir tout
                </Link>
              </div>

              <div className="space-y-2">
                {taches_actives.slice(0, 4).map((tache) => (
                  <label
                    key={tache.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={tache.completee}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900">{tache.titre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            tache.priorite === 'haute'
                              ? 'bg-red-100 text-red-700'
                              : tache.priorite === 'moyenne'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {tache.priorite}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(tache.echeance).toLocaleDateString('fr-CA')}
                        </span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
