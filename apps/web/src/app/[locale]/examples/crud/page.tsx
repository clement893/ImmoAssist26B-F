'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Container from '@/components/ui/Container';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

interface Item {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function ExampleCRUDPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Item[]>([
    {
      id: 1,
      name: 'Item 1',
      description: "Description de l'item 1",
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Item 2',
      description: "Description de l'item 2",
      status: 'inactive',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    status: 'active' | 'inactive';
  }>({ name: '', description: '', status: 'active' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = () => {
    setFormData({ name: '', description: '', status: 'active' });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      status: item.status,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleSubmitCreate = async () => {
    if (!formData.name.trim()) {
      showToast({
        message: 'Le nom est requis',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newItem: Item = {
        id: Math.max(...items.map((i) => i.id), 0) + 1,
        name: formData.name,
        description: formData.description,
        status: formData.status,
        createdAt: new Date().toISOString(),
      };

      setItems([...items, newItem]);
      setIsCreateModalOpen(false);
      showToast({
        message: 'Item créé avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de la création',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!formData.name.trim() || !selectedItem) {
      showToast({
        message: 'Le nom est requis',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setItems(
        items.map((item) => (item.id === selectedItem.id ? { ...item, ...formData } : item))
      );
      setIsEditModalOpen(false);
      setSelectedItem(null);
      showToast({
        message: 'Item modifié avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de la modification',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      setItems(items.filter((item) => item.id !== selectedItem.id));
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      showToast({
        message: 'Item supprimé avec succès',
        type: 'success',
      });
    } catch (error) {
      showToast({
        message: 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple CRUD Complet</h1>
        <p className="text-muted-foreground">
          Exemple complet de gestion CRUD avec modals, validation et gestion d'états
        </p>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">
            {items.length} item{items.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={handleCreate} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Créer un item
        </Button>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    item.status === 'active'
                      ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(item)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item)}
                  className="flex-1 text-error-600 hover:text-error-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun item pour le moment</p>
            <Button onClick={handleCreate} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Créer le premier item
            </Button>
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Créer un item"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmitCreate} disabled={isSubmitting}>
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Création...' : 'Créer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nom de l'item"
            required
            fullWidth
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de l'item"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Statut</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier l'item"
        size="md"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSubmitEdit} disabled={isSubmitting}>
              <Check className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Modification...' : 'Enregistrer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nom de l'item"
            required
            fullWidth
          />
          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description de l'item"
            fullWidth
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Statut</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background"
            >
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'item"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedItem?.name}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        loading={isSubmitting}
      />

      {/* Code Example */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Points clés de cet exemple :
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ CRUD complet (Create, Read, Update, Delete)</li>
            <li>✅ Modals pour création/édition</li>
            <li>✅ Modal de confirmation pour suppression</li>
            <li>✅ Gestion des états (loading, error, success)</li>
            <li>✅ Validation des formulaires</li>
            <li>✅ Feedback utilisateur avec toasts</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
