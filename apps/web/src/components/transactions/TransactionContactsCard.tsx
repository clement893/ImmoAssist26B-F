'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { realEstateContactsAPI } from '@/lib/api/real-estate-contacts';
import { TransactionContact } from '@/types/real-estate-contact';
import { Users, Mail, Phone, Building2, Plus, X } from 'lucide-react';
import AddContactToTransactionModal from './AddContactToTransactionModal';

interface TransactionContactsCardProps {
  transactionId: number;
  onContactAdded?: () => void;
  onContactRemoved?: () => void;
}

export default function TransactionContactsCard({
  transactionId,
  onContactAdded,
  onContactRemoved,
}: TransactionContactsCardProps) {
  const [contacts, setContacts] = useState<TransactionContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await realEstateContactsAPI.getTransactionContacts(transactionId);
      setContacts(response.data.contacts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des contacts';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [transactionId]);

  const handleContactAdded = () => {
    loadContacts();
    onContactAdded?.();
    setShowAddModal(false);
  };

  const handleRemoveContact = async (contactId: number, role: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ce contact du rôle "${role}" ?`)) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await realEstateContactsAPI.removeFromTransaction(transactionId, contactId, role);
      await loadContacts();
      onContactRemoved?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du contact';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Group contacts by role
  const contactsByRole = contacts.reduce((acc, tc) => {
    if (!acc[tc.role]) {
      acc[tc.role] = [];
    }
    acc[tc.role]!.push(tc);
    return acc;
  }, {} as Record<string, TransactionContact[]>);

  const roleOrder = [
    'Vendeur',
    'Acheteur',
    'Courtier immobilier (vendeur)',
    'Courtier immobilier (acheteur)',
    'Notaire instrumentant',
    'Inspecteur en bâtiments',
    'Arpenteur-géomètre',
    'Conseiller hypothécaire',
  ];

  const sortedRoles = [
    ...roleOrder.filter(role => contactsByRole[role]),
    ...Object.keys(contactsByRole).filter(role => !roleOrder.includes(role)),
  ];

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Intervenants</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un intervenant
            </Button>
          </div>

          {error && (
            <Alert variant="error" title="Erreur" className="mb-4">
              {error}
            </Alert>
          )}

          {loading && contacts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loading />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun intervenant associé à cette transaction</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedRoles.map((role) => (
                <div key={role}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    {role}
                  </h4>
                  <div className="space-y-3">
                    {contactsByRole[role]!.map((tc) => (
                      <div
                        key={`${tc.contact_id}-${tc.role}`}
                        className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-modern" // UI Revamp - Transition moderne
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {tc.contact.first_name} {tc.contact.last_name}
                            </span>
                            {tc.contact.company && (
                              <Badge variant="default" className="text-xs">
                                <Building2 className="w-3 h-3 mr-1" />
                                {tc.contact.company}
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {tc.contact.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {tc.contact.email}
                              </div>
                            )}
                            {tc.contact.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {tc.contact.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveContact(tc.contact_id, tc.role)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <AddContactToTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        transactionId={transactionId}
        onContactAdded={handleContactAdded}
      />
    </>
  );
}
