'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { Column } from '@/components/ui/DataTable';

interface User extends Record<string, unknown> {
  id: string;
  email: string;
  name: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin?: boolean;
  created_at: string;
}

export default function AdminUsersContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.get('/v1/users?page=1&page_size=100');

      // Backend returns paginated response: { items: [...], total: ..., page: ..., page_size: ... }
      interface PaginatedResponse<T> {
        data?: T | { items?: T[] };
      }
      const responseData = (response as PaginatedResponse<User[]>).data;
      let usersData: User[] = [];

      if (responseData && typeof responseData === 'object') {
        if ('items' in responseData) {
          const items = (responseData as { items?: unknown }).items;
          if (Array.isArray(items) && items.length > 0 && !Array.isArray(items[0])) {
            usersData = items as User[];
          }
        } else if (Array.isArray(responseData)) {
          usersData = responseData as User[];
        }
      }

      setUsers(usersData);
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des utilisateurs'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const { apiClient } = await import('@/lib/api/client');
      await apiClient.delete(`/v1/users/${selectedUser.id}`);

      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<User>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
    },
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (value) => (
        <Badge variant={value ? 'success' : 'default'}>{value ? 'Actif' : 'Inactif'}</Badge>
      ),
    },
    {
      key: 'is_admin',
      label: 'Rôle',
      render: (value) => (
        <Badge variant={value ? 'error' : 'default'}>{value ? 'Admin' : 'Utilisateur'}</Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              setSelectedUser(row);
              setDeleteModalOpen(true);
            }}
          >
            Supprimer
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <Container className="py-8">
        <Loading />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">Gérez tous les utilisateurs de la plateforme</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <Card className="mb-6">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Rechercher par email ou nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <DataTable data={filteredUsers} columns={columns} pageSize={10} />
      </Card>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        title="Confirmer la suppression"
      >
        <p className="mb-4">
          Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{selectedUser?.email}</strong> ?
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="ghost"
            onClick={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
          >
            Annuler
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </Container>
  );
}
