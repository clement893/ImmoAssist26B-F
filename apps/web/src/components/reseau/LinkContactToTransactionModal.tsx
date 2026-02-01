'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { transactionsAPI } from '@/lib/api/transactions-adapters';
import { realEstateContactsAPI } from '@/lib/api/real-estate-contacts';
import { TRANSACTION_ROLES } from '@/types/real-estate-contact';
import { Search } from 'lucide-react';
import Input from '@/components/ui/Input';

interface LinkContactToTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: number;
  onLinked?: () => void;
}

interface Transaction {
  id: number;
  name: string;
  dossier_number?: string;
  status: string;
}

export default function LinkContactToTransactionModal({
  isOpen,
  onClose,
  contactId,
  onLinked,
}: LinkContactToTransactionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search transactions when query changes
  useEffect(() => {
    const searchTransactions = async () => {
      if (searchQuery.length < 2) {
        setTransactions([]);
        return;
      }

      setSearching(true);
      try {
        const response = await transactionsAPI.list({
          search: searchQuery,
          limit: 10,
        });
        // transactionsAPI.list retourne { data: { transactions: [...] } }
        const transactionsData = response.data?.transactions || response.data || [];
        setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
      } catch (err) {
        console.error('Error searching transactions:', err);
        setTransactions([]);
      } finally {
        setSearching(false);
      }
    };

    const timeoutId = setTimeout(searchTransactions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTransactionId || !role) {
      setError('Veuillez sélectionner une transaction et un rôle');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await realEstateContactsAPI.addToTransaction(selectedTransactionId, {
        contact_id: contactId,
        role: role,
      });
      onLinked?.();
      // Reset form
      setSearchQuery('');
      setSelectedTransactionId(null);
      setRole('');
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la liaison du contact';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = TRANSACTION_ROLES.map(r => ({ label: r, value: r }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Lier ce contact à une transaction"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Search transactions */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Rechercher une transaction
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nom de transaction, numéro de dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Transaction results */}
          {searching && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Loading />
              <span>Recherche en cours...</span>
            </div>
          )}

          {!searching && searchQuery.length >= 2 && transactions.length > 0 && (
            <div className="mt-2 border rounded-xl max-h-48 overflow-y-auto">
              {transactions.map((transaction) => (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() => {
                    setSelectedTransactionId(transaction.id);
                    setSearchQuery(transaction.name);
                    setTransactions([]);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-muted transition-modern rounded-lg ${ // UI Revamp - Transition moderne
                    selectedTransactionId === transaction.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                  }`}
                >
                  <div className="font-medium">
                    {transaction.name}
                  </div>
                  {transaction.dossier_number && (
                    <div className="text-sm text-muted-foreground">Dossier: {transaction.dossier_number}</div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">Statut: {transaction.status}</div>
                </button>
              ))}
            </div>
          )}

          {!searching && searchQuery.length >= 2 && transactions.length === 0 && (
            <div className="mt-2 p-4 border rounded-xl text-center">
              <p className="text-sm text-muted-foreground">
                Aucune transaction trouvée
              </p>
            </div>
          )}
        </div>

        {/* Selected transaction display */}
        {selectedTransactionId && (
          <div className="p-4 bg-primary/5 rounded-xl border-2 border-primary/20">
            <div className="text-sm font-medium mb-1 text-primary">Transaction sélectionnée</div>
            <div className="text-sm text-muted-foreground">
              {transactions.find(t => t.id === selectedTransactionId)?.name || searchQuery}
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
          <Button type="submit" size="sm" disabled={loading || !selectedTransactionId || !role}>
            {loading ? 'Liaison...' : 'Lier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
