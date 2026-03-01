'use client';

import { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { transactionsAPI } from '@/lib/api/transactions-adapters';
import { realEstateContactsAPI } from '@/lib/api/real-estate-contacts';
import { TRANSACTION_ROLES } from '@/types/real-estate-contact';
import { Search, Check, ChevronDown } from 'lucide-react';
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
  property_address?: string;
  property_city?: string;
}

export default function LinkContactToTransactionModal({
  isOpen,
  onClose,
  contactId,
  onLinked,
}: LinkContactToTransactionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [role, setRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial transactions
  const loadInitialTransactions = async () => {
    setSearching(true);
    try {
      const response = await transactionsAPI.list({
        limit: 20,
      });
      const transactionsData = response.data?.transactions || response.data || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setTransactions([]);
    } finally {
      setSearching(false);
    }
  };

  // Load initial transactions when modal opens
  useEffect(() => {
    if (isOpen) {
      loadInitialTransactions();
    } else {
      // Reset state when modal closes
      setSearchQuery('');
      setTransactions([]);
      setSelectedTransaction(null);
      setRole('');
      setError(null);
      setShowDropdown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Search transactions when query changes
  useEffect(() => {
    const searchTransactions = async () => {
      if (searchQuery.length === 0) {
        // If search is empty, show initial transactions
        await loadInitialTransactions();
        setShowDropdown(true);
        return;
      }

      if (searchQuery.length < 2) {
        setTransactions([]);
        setShowDropdown(false);
        return;
      }

      setSearching(true);
      setShowDropdown(true);
      try {
        const response = await transactionsAPI.list({
          search: searchQuery,
          limit: 20,
        });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setSearchQuery(transaction.name);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTransaction || !role) {
      setError('Veuillez sélectionner une transaction et un rôle');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await realEstateContactsAPI.addToTransaction(selectedTransaction.id, {
        reseau_contact_id: contactId,
        role: role,
      });
      onLinked?.();
      // Reset form
      setSearchQuery('');
      setSelectedTransaction(null);
      setRole('');
      setShowDropdown(false);
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

        {/* Search transactions with dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Rechercher une transaction *
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Nom, numéro de dossier, adresse..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (transactions.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className="pl-12 pr-10 rounded-2xl"
            />
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Dropdown with transaction results */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-64 overflow-y-auto"
            >
              {searching && (
                <div className="p-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Loading />
                  <span>Recherche en cours...</span>
                </div>
              )}

              {!searching && transactions.length > 0 && (
                <div className="py-2">
                  {transactions.map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      onClick={() => handleSelectTransaction(transaction)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedTransaction?.id === transaction.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                            {transaction.name}
                          </div>
                          {transaction.dossier_number && (
                            <div className="text-sm text-gray-500 mb-1">
                              Dossier: {transaction.dossier_number}
                            </div>
                          )}
                          {(transaction.property_address || transaction.property_city) && (
                            <div className="text-xs text-gray-400">
                              {transaction.property_address}
                              {transaction.property_address && transaction.property_city ? ', ' : ''}
                              {transaction.property_city}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Statut: {transaction.status}
                          </div>
                        </div>
                        {selectedTransaction?.id === transaction.id && (
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!searching && transactions.length === 0 && searchQuery.length >= 2 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Aucune transaction trouvée pour "{searchQuery}"
                  </p>
                </div>
              )}

              {!searching && transactions.length === 0 && searchQuery.length < 2 && (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Tapez au moins 2 caractères pour rechercher
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected transaction display */}
        {selectedTransaction && (
          <div className="p-4 bg-blue-50 rounded-2xl border-2 border-blue-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-blue-900 mb-1">Transaction sélectionnée</div>
                <div className="text-sm font-semibold text-gray-900 mb-1">
                  {selectedTransaction.name}
                </div>
                {selectedTransaction.dossier_number && (
                  <div className="text-xs text-gray-600">
                    Dossier: {selectedTransaction.dossier_number}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  Statut: {selectedTransaction.status}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTransaction(null);
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button type="button" variant="white" size="sm" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="gradient" size="sm" disabled={loading || !selectedTransaction || !role}>
            {loading ? 'Liaison...' : 'Lier'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
