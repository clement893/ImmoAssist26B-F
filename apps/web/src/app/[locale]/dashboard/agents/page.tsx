'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Select from '@/components/ui/Select';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import LeaChat from '@/components/lea/LeaChat';
import { Plus, Edit, Trash2, User, Mail, Phone, Building } from 'lucide-react';
import LeaChat from '@/components/lea/LeaChat';

interface Agent extends Record<string, unknown> {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  agency: string | null;
  license_number: string | null;
  bio: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function AgentsContent() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    agency: '',
    license_number: '',
    bio: '',
    is_active: true,
  });

  // Load agents from API (placeholder - à connecter avec le backend)
  const loadAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Remplacer par l'appel API réel
      // const response = await agentsAPI.getAll();
      // setAgents(response.data);
      
      // Données de démonstration pour le moment
      setAgents([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des agents';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Remplacer par l'appel API réel
      // await agentsAPI.create(formData);
      // await loadAgents();
      setShowCreateModal(false);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        agency: '',
        license_number: '',
        bio: '',
        is_active: true,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'agent';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      first_name: agent.first_name,
      last_name: agent.last_name,
      email: agent.email,
      phone: agent.phone || '',
      agency: agent.agency || '',
      license_number: agent.license_number || '',
      bio: agent.bio || '',
      is_active: agent.is_active,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedAgent) return;
    
    setLoading(true);
    setError(null);
    try {
      // TODO: Remplacer par l'appel API réel
      // await agentsAPI.update(selectedAgent.id, formData);
      // await loadAgents();
      setShowEditModal(false);
      setSelectedAgent(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'agent';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet agent ?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // TODO: Remplacer par l'appel API réel
      // await agentsAPI.delete(id);
      // await loadAgents();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'agent';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Agent>[] = [
    {
      key: 'name',
      label: 'Nom',
      render: (agent) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium">
            {agent.first_name} {agent.last_name}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (agent) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Mail className="w-4 h-4" />
          {agent.email}
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      render: (agent) => agent.phone ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="w-4 h-4" />
          {agent.phone}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'agency',
      label: 'Agence',
      render: (agent) => agent.agency ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building className="w-4 h-4" />
          {agent.agency}
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'license_number',
      label: 'N° de licence',
      render: (agent) => agent.license_number || (
        <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (agent) => (
        <Badge variant={agent.is_active ? 'success' : 'secondary'}>
          {agent.is_active ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (agent) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(agent)}
            aria-label="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(agent.id)}
            aria-label="Supprimer"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agents Immobiliers</h1>
            <p className="text-muted-foreground mt-1">
              Gérez vos agents immobiliers et leurs informations
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter un agent
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {/* Agents Table */}
        <Card>
          {loading && agents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun agent</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter votre premier agent immobilier
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un agent
              </Button>
            </div>
          ) : (
            <DataTable
              data={agents}
              columns={columns}
              searchable
              searchPlaceholder="Rechercher un agent..."
            />
          )}
        </Card>

        {/* Create Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setFormData({
              first_name: '',
              last_name: '',
              email: '',
              phone: '',
              agency: '',
              license_number: '',
              bio: '',
              is_active: true,
            });
          }}
          title="Ajouter un agent"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prénom *
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Prénom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom *
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Nom"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemple.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Agence
              </label>
              <Input
                value={formData.agency}
                onChange={(e) =>
                  setFormData({ ...formData, agency: e.target.value })
                }
                placeholder="Nom de l'agence"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                N° de licence
              </label>
              <Input
                value={formData.license_number}
                onChange={(e) =>
                  setFormData({ ...formData, license_number: e.target.value })
                }
                placeholder="Numéro de licence professionnelle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Biographie
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Présentation de l'agent..."
                rows={4}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium">Agent actif</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    first_name: '',
                    last_name: '',
                    email: '',
                    phone: '',
                    agency: '',
                    license_number: '',
                    bio: '',
                    is_active: true,
                  });
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleCreate} disabled={loading}>
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
            setSelectedAgent(null);
          }}
          title="Modifier l'agent"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Prénom *
                </label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  placeholder="Prénom"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom *
                </label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  placeholder="Nom"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemple.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Téléphone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+33 6 12 34 56 78"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Agence
              </label>
              <Input
                value={formData.agency}
                onChange={(e) =>
                  setFormData({ ...formData, agency: e.target.value })
                }
                placeholder="Nom de l'agence"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                N° de licence
              </label>
              <Input
                value={formData.license_number}
                onChange={(e) =>
                  setFormData({ ...formData, license_number: e.target.value })
                }
                placeholder="Numéro de licence professionnelle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Biographie
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Présentation de l'agent..."
                rows={4}
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm font-medium">Agent actif</span>
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedAgent(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Léa AI Assistant - Fixed position on desktop */}
        <div className="fixed bottom-6 right-6 w-96 h-[500px] z-40 hidden lg:block">
          <LeaChat />
        </div>
      </div>
    </Container>
  );
}

export default function AgentsPage() {
  return <AgentsContent />;
}
