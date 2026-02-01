'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { realEstateContactsAPI } from '@/lib/api/real-estate-contacts';
import { RealEstateContact, TRANSACTION_ROLES } from '@/types/real-estate-contact';
import { Search, Plus } from 'lucide-react';
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
  const [contacts, setContacts] = useState<RealEstateContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Search contacts when query changes
  useEffect(() => {
    const searchContacts = async () => {
      if (searchQuery.length < 2) {
        setContacts([]);
        return;
      }

      setSearching(true);
      try {
        const response = await realEstateContactsAPI.list({
          search: searchQuery,
          limit: 10,
        });
        setContacts(response.data.contacts);
      } catch (err) {
        console.error('Error searching contacts:', err);
        setContacts([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchContacts, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
      // Reset form
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

        {/* Search contacts */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Rechercher un contact
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

          {/* Contact results */}
          {searching && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loading />
              <span>Recherche en cours...</span>
            </div>
          )}

          {!searching && searchQuery.length >= 2 && contacts.length > 0 && (
            <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => {
                    setSelectedContactId(contact.id);
                    setSearchQuery(`${contact.first_name} ${contact.last_name}${contact.company ? ` - ${contact.company}` : ''}`);
                    setContacts([]);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-muted transition-modern ${ // UI Revamp - Transition moderne
                    selectedContactId === contact.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <div className="font-medium">
                    {contact.first_name} {contact.last_name}
                  </div>
                  {contact.company && (
                    <div className="text-sm text-muted-foreground">{contact.company}</div>
                  )}
                  {contact.email && (
                    <div className="text-xs text-muted-foreground">{contact.email}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.length >= 2 && contacts.length === 0 && (
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
          )}
        </div>

        {/* Selected contact display */}
        {selectedContactId && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-1">Contact sélectionné</div>
            <div className="text-sm text-muted-foreground">
              {contacts.find(c => c.id === selectedContactId)?.first_name}{' '}
              {contacts.find(c => c.id === selectedContactId)?.last_name}
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
