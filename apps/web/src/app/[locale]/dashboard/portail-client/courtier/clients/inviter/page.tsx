'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  UserPlus,
  Mail,
  Phone,
  User,
  Home,
  FileText,
  MessageSquare,
  Calendar,
  CheckCircle2,
  Send,
  Users,
  Search,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { reseauContactsAPI } from '@/lib/api/reseau-adapters';
import type { Contact } from '@/lib/api/reseau-adapters';

export default function InviterClientPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    type_projet: 'achat',
    message_personnalise: '',
  });

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    let cancelled = false;
    setContactsLoading(true);
    reseauContactsAPI
      .list(0, 300)
      .then((list: Contact[]) => {
        if (!cancelled) setContacts(list);
      })
      .catch(() => {
        if (!cancelled) setContacts([]);
      })
      .finally(() => {
        if (!cancelled) setContactsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const contactsWithEmail = useMemo(
    () => contacts.filter((c) => c.email && c.email.trim() !== ''),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contactsWithEmail.slice(0, 20);
    return contactsWithEmail
      .filter(
        (c) =>
          (c.first_name?.toLowerCase().includes(q) ||
            c.last_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            `${(c.first_name || '').trim()} ${(c.last_name || '').trim()}`.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [contactsWithEmail, contactSearch]);

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setFormData((prev) => ({
      ...prev,
      prenom: contact.first_name || '',
      nom: contact.last_name || '',
      email: contact.email || '',
      telephone: contact.phone || '',
    }));
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setFormData((prev) => ({
      ...prev,
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
    }));
    setContactSearch('');
  };

  const [permissions, setPermissions] = useState({
    documents: true,
    messagerie: true,
    taches: true,
    calendrier: true,
    proprietes: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiClient.post('v1/client-invitations', {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone || undefined,
        type_projet: formData.type_projet,
        message_personnalise: formData.message_personnalise || undefined,
        acces_documents: permissions.documents,
        acces_messagerie: permissions.messagerie,
        acces_taches: permissions.taches,
        acces_calendrier: permissions.calendrier,
        acces_proprietes: permissions.proprietes,
      });
      router.push('/dashboard/portail-client/courtier/clients');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : err instanceof Error
            ? err.message
            : 'Erreur lors de l\'envoi de l\'invitation';
      setError(typeof message === 'string' ? message : 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1000px] mx-auto px-8 py-6">
          <Link
            href="/dashboard/portail-client/courtier/clients"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la liste
          </Link>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-xl">
              <UserPlus className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Inviter un client</h1>
              <p className="text-sm text-gray-500 font-light">Créez un accès portail pour votre client</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Choisir un contact existant
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Sélectionnez un contact dans votre carnet pour préremplir le formulaire (contacts avec email uniquement).
            </p>
            {selectedContact ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{selectedContact.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClearContact}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Effacer la sélection
                </button>
              </div>
            ) : (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    placeholder="Rechercher par nom ou email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {contactsLoading ? (
                    <div className="p-6 text-center text-sm text-gray-500">Chargement des contacts...</div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      {contactsWithEmail.length === 0
                        ? 'Aucun contact avec email. Ajoutez des contacts dans Réseau → Contacts.'
                        : 'Aucun contact ne correspond à la recherche.'}
                    </div>
                  ) : (
                    filteredContacts.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectContact(c)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="p-1.5 bg-gray-100 rounded-lg">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {c.first_name} {c.last_name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{c.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations du client</h2>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                    placeholder="Tremblay"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                    placeholder="jean.tremblay@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200"
                    placeholder="514-555-0101"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Type de projet</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: 'achat', label: 'Achat', icon: Home },
                { value: 'vente', label: 'Vente', icon: Home },
                { value: 'location', label: 'Location', icon: Home },
              ].map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type_projet: type.value })}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    formData.type_projet === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <type.icon
                    className={`w-8 h-8 mx-auto mb-3 ${
                      formData.type_projet === type.value ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      formData.type_projet === type.value ? 'text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    {type.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Permissions d'accès</h2>
            <p className="text-sm text-gray-500 mb-6">Sélectionnez les modules accessibles au client</p>
            <div className="space-y-4">
              {[
                { key: 'documents', label: 'Documents', description: 'Accès aux documents partagés', icon: FileText },
                { key: 'messagerie', label: 'Messagerie', description: 'Communication avec le courtier', icon: MessageSquare },
                { key: 'taches', label: 'Tâches', description: 'Liste des tâches à compléter', icon: CheckCircle2 },
                { key: 'calendrier', label: 'Calendrier', description: 'Visites et rendez-vous', icon: Calendar },
                { key: 'proprietes', label: 'Propriétés', description: 'Favoris et propriétés visitées', icon: Home },
              ].map((perm) => (
                <label
                  key={perm.key}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={permissions[perm.key as keyof typeof permissions]}
                    onChange={(e) =>
                      setPermissions({ ...permissions, [perm.key]: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="p-2 bg-white rounded-lg">
                    <perm.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{perm.label}</p>
                    <p className="text-xs text-gray-500">{perm.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Message personnalisé</h2>
            <p className="text-sm text-gray-500 mb-6">Ajoutez un message qui sera inclus dans l'email d'invitation</p>
            <textarea
              value={formData.message_personnalise}
              onChange={(e) => setFormData({ ...formData, message_personnalise: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-200 resize-none"
              placeholder="Bonjour Jean,&#10;&#10;Je vous invite à accéder à votre portail client..."
            />
          </div>

          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Aperçu de l'invitation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Un email sera envoyé à <span className="font-medium">{formData.email || "l'adresse email"}</span> avec le lien d'activation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link
              href="/dashboard/portail-client/courtier/clients"
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Envoi...' : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
