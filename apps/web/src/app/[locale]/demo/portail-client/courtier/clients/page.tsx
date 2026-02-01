'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  FileText,
  MessageSquare,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Settings,
  Download,
} from 'lucide-react';

// Types
interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_projet: 'achat' | 'vente' | 'location';
  statut: 'actif' | 'en_transaction' | 'complété' | 'inactif';
  date_invitation: string;
  derniere_connexion?: string;
  courtier_assigne: string;
  progression: number;
  documents_partages: number;
  messages_non_lus: number;
  taches_completees: number;
  taches_totales: number;
}

export default function ClientsListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [filterProjet, setFilterProjet] = useState<string>('tous');

  // Données de démo
  const clients: Client[] = [
    {
      id: '1',
      nom: 'Tremblay',
      prenom: 'Sophie',
      email: 'sophie.tremblay@email.com',
      telephone: '514-555-0101',
      type_projet: 'achat',
      statut: 'en_transaction',
      date_invitation: '2024-01-15',
      derniere_connexion: '2024-02-01T10:30:00',
      courtier_assigne: 'Marie Dubois',
      progression: 65,
      documents_partages: 12,
      messages_non_lus: 2,
      taches_completees: 8,
      taches_totales: 12,
    },
    {
      id: '2',
      nom: 'Gagnon',
      prenom: 'Marc',
      email: 'marc.gagnon@email.com',
      telephone: '438-555-0202',
      type_projet: 'vente',
      statut: 'actif',
      date_invitation: '2024-01-20',
      derniere_connexion: '2024-01-31T15:45:00',
      courtier_assigne: 'Marie Dubois',
      progression: 35,
      documents_partages: 8,
      messages_non_lus: 0,
      taches_completees: 4,
      taches_totales: 10,
    },
    {
      id: '3',
      nom: 'Bouchard',
      prenom: 'Julie',
      email: 'julie.bouchard@email.com',
      telephone: '450-555-0303',
      type_projet: 'achat',
      statut: 'complété',
      date_invitation: '2023-11-10',
      derniere_connexion: '2024-01-25T09:15:00',
      courtier_assigne: 'Marie Dubois',
      progression: 100,
      documents_partages: 25,
      messages_non_lus: 0,
      taches_completees: 15,
      taches_totales: 15,
    },
    {
      id: '4',
      nom: 'Lavoie',
      prenom: 'Pierre',
      email: 'pierre.lavoie@email.com',
      telephone: '514-555-0404',
      type_projet: 'achat',
      statut: 'actif',
      date_invitation: '2024-01-28',
      derniere_connexion: '2024-01-30T14:20:00',
      courtier_assigne: 'Marie Dubois',
      progression: 15,
      documents_partages: 3,
      messages_non_lus: 1,
      taches_completees: 2,
      taches_totales: 8,
    },
    {
      id: '5',
      nom: 'Roy',
      prenom: 'Isabelle',
      email: 'isabelle.roy@email.com',
      telephone: '438-555-0505',
      type_projet: 'vente',
      statut: 'en_transaction',
      date_invitation: '2024-01-05',
      derniere_connexion: '2024-02-01T11:00:00',
      courtier_assigne: 'Marie Dubois',
      progression: 80,
      documents_partages: 18,
      messages_non_lus: 3,
      taches_completees: 11,
      taches_totales: 13,
    },
    {
      id: '6',
      nom: 'Côté',
      prenom: 'François',
      email: 'francois.cote@email.com',
      telephone: '450-555-0606',
      type_projet: 'location',
      statut: 'inactif',
      date_invitation: '2023-12-15',
      derniere_connexion: '2024-01-10T08:30:00',
      courtier_assigne: 'Marie Dubois',
      progression: 10,
      documents_partages: 2,
      messages_non_lus: 0,
      taches_completees: 1,
      taches_totales: 5,
    },
  ];

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchSearch =
        searchQuery === '' ||
        `${client.prenom} ${client.nom}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatut = filterStatut === 'tous' || client.statut === filterStatut;
      const matchProjet = filterProjet === 'tous' || client.type_projet === filterProjet;

      return matchSearch && matchStatut && matchProjet;
    });
  }, [clients, searchQuery, filterStatut, filterProjet]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'actif':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'en_transaction':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'complété':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      case 'inactif':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Activity className="w-3.5 h-3.5" />;
      case 'en_transaction':
        return <Clock className="w-3.5 h-3.5" />;
      case 'complété':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'inactif':
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <Activity className="w-3.5 h-3.5" />;
    }
  };

  const getStatutLabel = (statut: string) => {
    switch (statut) {
      case 'actif':
        return 'Actif';
      case 'en_transaction':
        return 'En transaction';
      case 'complété':
        return 'Complété';
      case 'inactif':
        return 'Inactif';
      default:
        return statut;
    }
  };

  const getProjetLabel = (type: string) => {
    switch (type) {
      case 'achat':
        return 'Achat';
      case 'vente':
        return 'Vente';
      case 'location':
        return 'Location';
      default:
        return type;
    }
  };

  const stats = {
    total: clients.length,
    actifs: clients.filter((c) => c.statut === 'actif' || c.statut === 'en_transaction').length,
    en_transaction: clients.filter((c) => c.statut === 'en_transaction').length,
    completes: clients.filter((c) => c.statut === 'complété').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl">
                <Users className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Mes clients</h1>
                <p className="text-sm text-gray-500 font-light">
                  {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <Link
              href="/fr/demo/portail-client/courtier/clients/inviter"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Inviter un client
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 mb-1">Actifs</p>
              <p className="text-2xl font-semibold text-blue-700">{stats.actifs}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-green-600 mb-1">En transaction</p>
              <p className="text-2xl font-semibold text-green-700">{stats.en_transaction}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Complétés</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.completes}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                />
              </div>

              <button className="px-4 py-3 bg-white hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 transition-colors flex items-center gap-2 border border-gray-200">
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Statut:</span>
              {['tous', 'actif', 'en_transaction', 'complété', 'inactif'].map((statut) => (
                <button
                  key={statut}
                  onClick={() => setFilterStatut(statut)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterStatut === statut
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {statut === 'tous' ? 'Tous' : getStatutLabel(statut)}
                </button>
              ))}

              <div className="h-4 w-px bg-gray-300 mx-2" />

              <span className="text-xs text-gray-500 font-medium">Projet:</span>
              {['tous', 'achat', 'vente', 'location'].map((projet) => (
                <button
                  key={projet}
                  onClick={() => setFilterProjet(projet)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filterProjet === projet
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {projet === 'tous' ? 'Tous' : getProjetLabel(projet)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Projet
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Progression
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Activité
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.prenom} {client.nom}
                        </p>
                        <p className="text-xs text-gray-500">
                          Invité le {new Date(client.date_invitation).toLocaleDateString('fr-CA')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail className="w-3.5 h-3.5" />
                          {client.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone className="w-3.5 h-3.5" />
                          {client.telephone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        {getProjetLabel(client.type_projet)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatutColor(
                          client.statut
                        )}`}
                      >
                        {getStatutIcon(client.statut)}
                        {getStatutLabel(client.statut)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${client.progression}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700">{client.progression}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          {client.documents_partages}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {client.messages_non_lus > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-medium">
                              {client.messages_non_lus}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {client.taches_completees}/{client.taches_totales}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/fr/demo/portail-client/courtier/clients/${client.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
                        <Link
                          href={`/fr/demo/portail-client/courtier/clients/${client.id}/acces`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Gérer accès"
                        >
                          <Settings className="w-4 h-4 text-gray-600" />
                        </Link>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-500">Aucun client trouvé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
