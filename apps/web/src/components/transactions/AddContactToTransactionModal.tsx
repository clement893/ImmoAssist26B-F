'use client';

import { useState, useEffect, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { realEstateContactsAPI } from '@/lib/api/real-estate-contacts';
import { RealEstateContact, TRANSACTION_ROLES } from '@/types/real-estate-contact';
import { Search, Plus, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AddContactToTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
  onContactAdded: () => void;
}

export default function AddContactToTransactionModal({
  isOpen,
  onClose,
  transactionId,
  onContactAdded,
}: AddContactToTransactionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [initialContacts, setInitialContacts] = useState<RealEstateContact[]>([]);
  const [searchResults, setSearchResults] = useState<RealEstateContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Load initial contact list when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setInitialLoading(true);
    setSearchQuery('');
    setSelectedContactId(null);
    setSearchResults([]);
    realEstateContactsAPI
      .list({ limit: 100 })
      .then((res) => setInitialContacts(res.data.contacts))
      .catch(() => setInitialContacts([]))
      .finally(() => setInitialLoading(false));
  }, [isOpen]);

  // Search contacts when query has 2+ chars
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await realEstateContactsAPI.list({
          search: searchQuery,
          limit: 50,
        });
        setSearchResults(response.data.contacts);
      } catch (err) {
        console.error('Error searching contacts:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const displayContacts = useMemo(() => {
    if (searchQuery.trim().length >= 2) return searchResults;
    return initialContacts;
  }, [searchQuery, searchResults, initialContacts]);

  const selectedContact = useMemo(
    () => displayContacts.find((c) => c.id === selectedContactId) ?? initialContacts.find((c) => c.id === selectedContactId),
    [displayContacts, initialContacts, selectedContactId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContactId || !role) {
      setError('Veuillez sélectionner un contact et un rôle');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await realEstateContactsAPI.addToTransaction(transactionId, {
        contact_id: selectedContactId,
        role: role,
      });
      onContactAdded();
      setSearchQuery('');
      setSelectedContactId(null);
      setRole('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'ajout du contact';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewContact = () => {
    // Close modal and redirect to contacts page
    onClose();
    router.push(`/dashboard/contacts?create=true&name=${encodeURIComponent(searchQuery)}`);
  };

  const roleOptions = TRANSACTION_ROLES.map(r => ({ label: r, value: r }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un intervenant"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Search and contact list */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Choisir un contact dans la liste ou rechercher
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nom, email ou entreprise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {initialLoading && initialContacts.length === 0 ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loading />
              <span>Chargement de la liste des contacts...</span>
            </div>
          ) : searching && searchQuery.trim().length >= 2 ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loading />
              <span>Recherche en cours...</span>
            </div>
          ) : displayContacts.length > 0 ? (
            <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
              {displayContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setSelectedContactId(contact.id);
                  }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-muted transition-modern flex items-center gap-3 ${
                    selectedContactId === contact.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="p-1.5 bg-muted rounded-lg shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    {contact.company && (
                      <div className="text-sm text-muted-foreground truncate">{contact.company}</div>
                    )}
                    {contact.email && (
                      <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim().length >= 2 ? (
            <div className="mt-2 p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Aucun contact trouvé
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewContact}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Créer un nouveau contact
              </Button>
            </div>
          ) : (
            <div className="mt-2 p-4 border rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Aucun contact. Créez-en un dans Contacts.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCreateNewContact}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                Créer un nouveau contact
              </Button>
            </div>
          )}
        </div>

        {/* Selected contact display */}
        {selectedContactId && selectedContact && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-sm font-medium mb-1">Contact sélectionné</div>
            <div className="text-sm text-muted-foreground">
              {selectedContact.first_name} {selectedContact.last_name}
              {selectedContact.company && ` · ${selectedContact.company}`}
            </div>
          </div>
        )}

        {/* Role selection */}
        <div>
          <Select
            label="Rôle dans la transaction *"
            options={roleOptions}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            placeholder="Sélectionner un rôle"
          />
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" size="sm" disabled={loading || !selectedContactId || !role}>
            {loading ? 'Ajout...' : 'Ajouter'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
