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
import { projectsAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface Project extends Record<string, unknown> {
  id: number;
  name: string;
  description: string | null;
  status: 'active' | 'archived' | 'completed';
  created_at: string;
  updated_at: string;
  user_id: number;
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'archived' | 'completed',
  });

  // Load projects from API
  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsAPI.list();
      setProjects(response.data || []);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  // Initialize projects on mount
  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.create({
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
      });

      setProjects([...projects, response.data]);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la création du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async () => {
    if (!selectedProject || !formData.name.trim()) {
      setError('Le nom du projet est requis');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await projectsAPI.update(selectedProject.id, {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
      });

      setProjects(projects.map((p) => (p.id === selectedProject.id ? response.data : p)));
      setShowEditModal(false);
      setSelectedProject(null);
      resetForm();
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await projectsAPI.delete(projectId);

      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression du projet');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'default'> = {
      active: 'success',
      completed: 'default',
      archived: 'warning',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Actif',
      completed: 'Terminé',
      archived: 'Archivé',
    };
    return labels[status] || status;
  };

  const columns: Column<Project>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'description',
      label: 'Description',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {value && String(value).length > 50
            ? `${String(value).substring(0, 50)}...`
            : value
              ? String(value)
              : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={getStatusBadge(String(value))}>{getStatusLabel(String(value))}</Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-2"
            title="Modifier"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteProject(row.id)}
            className="p-2 text-error-600 hover:text-error-700"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <p className="text-foreground">Gérez vos projets et leurs statuts</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nouveau projet
          </Button>
        </div>

        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {loading && projects.length === 0 ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-6">
              <DataTable
                data={projects}
                columns={columns}
                pageSize={10}
                searchable={true}
                searchPlaceholder="Rechercher un projet..."
                emptyMessage="Aucun projet trouvé"
                loading={loading}
              />
            </div>
          </Card>
        )}

        {/* Create Project Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            resetForm();
          }}
          title="Créer un nouveau projet"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleCreateProject} loading={loading}>
                Créer
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Nom du projet *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Projet Alpha"
                fullWidth
              />
            </div>
            <div>
              <Textarea
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du projet..."
                rows={4}
                fullWidth
              />
            </div>
            <div>
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'archived' | 'completed',
                  })
                }
                fullWidth
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'completed', label: 'Terminé' },
                  { value: 'archived', label: 'Archivé' },
                ]}
              />
            </div>
          </div>
        </Modal>

        {/* Edit Project Modal */}
        <Modal
          isOpen={showEditModal && selectedProject !== null}
          onClose={() => {
            setShowEditModal(false);
            setSelectedProject(null);
            resetForm();
          }}
          title="Modifier le projet"
          size="md"
          footer={
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedProject(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleEditProject} loading={loading}>
                Enregistrer
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <Input
                label="Nom du projet *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Projet Alpha"
                fullWidth
              />
            </div>
            <div>
              <Textarea
                label="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description du projet..."
                rows={4}
                fullWidth
              />
            </div>
            <div>
              <Select
                label="Statut"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'archived' | 'completed',
                  })
                }
                fullWidth
                options={[
                  { value: 'active', label: 'Actif' },
                  { value: 'completed', label: 'Terminé' },
                  { value: 'archived', label: 'Archivé' },
                ]}
              />
            </div>
          </div>
        </Modal>
      </Container>
    </div>
  );
}

export default function ProjectsPage() {
  return <ProjectsContent />;
}
