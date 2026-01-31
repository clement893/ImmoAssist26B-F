'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import { realEstateContactsAPI } from '@/lib/api/real-estate-contacts';
import { RealEstateContact, ContactType, RealEstateContactCreate, RealEstateContactUpdate } from '@/types/real-estate-contact';
import { Plus, Search, Mail, Phone, Building2, Edit, Trash2, Users } from 'lucide-react';

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  [ContactType.CLIENT]: 'Client',
  [ContactType.REAL_ESTATE_BROKER]: 'Courtier immobilier',
  [ContactType.MORTGAGE_BROKER]: 'Conseiller hypothécaire',
  [ContactType.NOTARY]: 'Notaire',
  [ContactType.INSPECTOR]: 'Inspecteur',
  [ContactType.CONTRACTOR]: 'Entrepreneur',
  [ContactType.INSURANCE_BROKER]: 'Courtier d\'assurance',
  [ContactType.OTHER]: 'Autre',
};

const CONTACT_TYPE_OPTIONS = Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({
  label,
  value,
}));

function ContactsContent() {
  const [contacts, setContacts] = useState<RealEstateContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<RealEstateContact | null>(null);
  const [formData, setFormData] = useState<RealEstateContactCreate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    type: ContactType.CLIENT,
  });

  const loadContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await realEstateContactsAPI.list({
        search: searchQuery || undefined,
        type: typeFilter || undefined,
        limit: 100,
      });
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
  }, [searchQuery, typeFilter]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      await realEstateContactsAPI.create(formData);
      setShowCreateModal(false);
      resetForm();
      await loadContacts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du contact';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedContact) return;

    setLoading(true);
    setError(null);
    try {
      const updateData: RealEstateContactUpdate = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        company: formData.company || undefined,
        type: formData.type,
      };
      await realEstateContactsAPI.update(selectedContact.id, updateData);
      setShowEditModal(false);
      setSelectedContact(null);
      resetForm();
      await loadContacts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du contact';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await realEstateContactsAPI.delete(id);
      await loadContacts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du contact';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      type: ContactType.CLIENT,
    });
  };

  const openEditModal = (contact: RealEstateContact) => {
    setSelectedContact(contact);
    setFormData({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
      type: contact.type,
    });
    setShowEditModal(true);
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Carnet d'Adresses</h1>
            <p className="text-muted-foreground mt-1">
              Gérez tous vos contacts pour les transactions immobilières
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau contact
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                options={[{ label: 'Tous les types', value: '' }, ...CONTACT_TYPE_OPTIONS]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as ContactType | '')}
                className="min-w-[200px]"
              />
            </div>
          </div>
        </Card>

        {/* Contacts Table */}
        {loading && contacts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loading />
          </div>
        ) : contacts.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun contact</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre premier contact
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un contact
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-semibold">Nom</th>
                    <th className="text-left p-4 font-semibold">Type</th>
                    <th className="text-left p-4 font-semibold">Email</th>
                    <th className="text-left p-4 font-semibold">Téléphone</th>
                    <th className="text-left p-4 font-semibold">Entreprise</th>
                    <th className="text-right p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline">
                          {CONTACT_TYPE_LABELS[contact.type]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {contact.email ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            {contact.email}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {contact.phone ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {contact.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {contact.company ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="w-4 h-4 text-muted-foreground" />
                            {contact.company}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(contact)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(contact.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Nouveau contact"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Nom *"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Entreprise"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Select
              label="Type de contact *"
              options={CONTACT_TYPE_OPTIONS}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
              required
            />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={loading || !formData.first_name || !formData.last_name}>
                {loading ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedContact(null);
            resetForm();
          }}
          title="Modifier le contact"
          size="md"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom *"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
              <Input
                label="Nom *"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Téléphone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="Entreprise"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
            <Select
              label="Type de contact *"
              options={CONTACT_TYPE_OPTIONS}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
              required
            />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedContact(null);
                  resetForm();
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={loading || !formData.first_name || !formData.last_name}>
                {loading ? 'Mise à jour...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Container>
  );
}

export default function ContactsPage() {
  return <ContactsContent />;
}
