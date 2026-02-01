'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  Search,
  Mail,
  Phone,
  Eye,
  Settings,
  Download,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ClientInvitation {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  type_projet: string;
  statut: string;
  date_invitation: string;
  derniere_connexion: string | null;
}

export default function ClientsListPage() {
  const [clients, setClients] = useState<ClientInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('tous');
  const [filterProjet, setFilterProjet] = useState<string>('tous');

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get<ClientInvitation[]>('v1/client-invitations');
        setClients(Array.isArray(response.data) ? response.data : []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des clients');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

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
      case 'invite':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'inactif':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case 'actif':
        return <Activity className="w-3.5 h-3.5" />;
      case 'invite':
        return <Clock className="w-3.5 h-3.5" />;
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
      case 'invite':
        return 'Invité';
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
    actifs: clients.filter((c) => c.statut === 'actif').length,
    invites: clients.filter((c) => c.statut === 'invite').length,
    inactifs: clients.filter((c) => c.statut === 'inactif').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                  {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/portail-client/courtier/clients/inviter"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Inviter un client
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Total</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs text-blue-600 mb-1">Actifs</p>
              <p className="text-2xl font-semibold text-blue-700">{stats.actifs}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-amber-600 mb-1">Invités</p>
              <p className="text-2xl font-semibold text-amber-700">{stats.invites}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">Inactifs</p>
              <p className="text-2xl font-semibold text-gray-700">{stats.inactifs}</p>
            </div>
          </div>

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
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Statut:</span>
              {['tous', 'invite', 'actif', 'inactif'].map((statut) => (
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

      <div className="max-w-[1400px] mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Projet</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dernière connexion</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
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
                        {client.telephone && (
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Phone className="w-3.5 h-3.5" />
                            {client.telephone}
                          </div>
                        )}
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
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {client.derniere_connexion
                        ? new Date(client.derniere_connexion).toLocaleDateString('fr-CA')
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/portail-client/courtier/clients/${client.id}`}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
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
