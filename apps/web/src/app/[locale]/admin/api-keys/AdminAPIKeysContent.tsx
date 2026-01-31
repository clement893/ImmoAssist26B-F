'use client';

import { useEffect, useState } from 'react';
import { getErrorMessage } from '@/lib/errors';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Alert from '@/components/ui/Alert';
import Input from '@/components/ui/Input';
import Loading from '@/components/ui/Loading';
import Modal from '@/components/ui/Modal';
import DataTable from '@/components/ui/DataTable';
import { Column } from '@/components/ui/DataTable';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { apiKeysAPI } from '@/lib/api';
import type { AdminAPIKeyListResponse } from '@/lib/api';
import { logger } from '@/lib/logger';
import { Key, Search, Trash2 } from 'lucide-react';

export default function AdminAPIKeysContent() {
  const [apiKeys, setApiKeys] = useState<AdminAPIKeyListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<AdminAPIKeyListResponse | null>(null);
  const [userIdFilter, setUserIdFilter] = useState<string>('');

  useEffect(() => {
    fetchAPIKeys();
  }, [includeInactive, userIdFilter]);

  const fetchAPIKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = userIdFilter ? parseInt(userIdFilter, 10) : undefined;
      if (userIdFilter && isNaN(userId!)) {
        setError('Invalid user ID');
        return;
      }
      const keys = await apiKeysAPI.adminList(includeInactive, userId);
      setApiKeys(keys);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Erreur lors du chargement des clés API');
      setError(errorMessage);
      logger.error('Failed to load API keys', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedKey) return;

    try {
      await apiKeysAPI.revoke(selectedKey.id, 'Revoked by admin');
      setApiKeys(apiKeys.filter((k) => k.id !== selectedKey.id));
      setDeleteModalOpen(false);
      setSelectedKey(null);
      setError(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err, 'Erreur lors de la révocation de la clé API');
      setError(errorMessage);
      logger.error('Failed to revoke API key', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const filteredKeys = apiKeys.filter((key) => {
    const matchesSearch =
      key.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      key.key_prefix.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (key.user_name && key.user_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const isExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const columns: Column<AdminAPIKeyListResponse>[] = [
    {
      key: 'id',
      label: 'ID',
      render: (_value, key) => <span className="font-mono text-sm">{key.id}</span>,
    },
    {
      key: 'name',
      label: 'Nom',
      render: (_value, key) => <div className="font-medium">{key.name}</div>,
    },
    {
      key: 'user_email',
      label: 'Utilisateur',
      render: (_value, key) => (
        <div>
          <div className="font-medium">{key.user_email}</div>
          {key.user_name && <div className="text-xs text-muted-foreground">{key.user_name}</div>}
          <div className="text-xs text-muted-foreground">ID: {key.user_id}</div>
        </div>
      ),
    },
    {
      key: 'key_prefix',
      label: 'Préfixe',
      render: (_value, key) => (
        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
          {key.key_prefix}••••••••
        </code>
      ),
    },
    {
      key: 'is_active',
      label: 'Statut',
      render: (_value, key) => (
        <div className="flex flex-col gap-1">
          {key.is_active ? (
            <Badge variant="success">Actif</Badge>
          ) : (
            <Badge variant="error">Inactif</Badge>
          )}
          {isExpired(key.expires_at) && (
            <Badge variant="error" className="text-xs">
              Expiré
            </Badge>
          )}
          {key.expires_at && !isExpired(key.expires_at) && (
            <Badge variant="warning" className="text-xs">
              Expire {new Date(key.expires_at).toLocaleDateString()}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'rotation_policy',
      label: 'Rotation',
      render: (_value, key) => (
        <div className="text-sm">
          <div>{key.rotation_policy}</div>
          <div className="text-xs text-muted-foreground">
            {key.rotation_count} rotation{key.rotation_count !== 1 ? 's' : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'usage_count',
      label: 'Utilisation',
      render: (_value, key) => (
        <div className="text-sm">
          <div>
            {key.usage_count} utilisation{key.usage_count !== 1 ? 's' : ''}
          </div>
          {key.last_used_at && (
            <div className="text-xs text-muted-foreground">
              Dernière: {new Date(key.last_used_at).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (_value, key) => (
        <div className="text-sm">
          {new Date(key.created_at).toLocaleDateString()}
          <div className="text-xs text-muted-foreground">
            {new Date(key.created_at).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, key) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedKey(key);
              setDeleteModalOpen(true);
            }}
            disabled={!key.is_active}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Gestion des Clés API"
        description="Consulter et gérer toutes les clés API du système"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Clés API' },
        ]}
      />

      {error && (
        <div className="mt-6">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      <Section title="Clés API" className="mt-6">
        <Card>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email, préfixe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Filtrer par ID utilisateur"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                className="w-40"
              />
              <label className="flex items-center gap-2 px-4 py-2 border rounded cursor-pointer hover:bg-muted">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => setIncludeInactive(e.target.checked)}
                  className="mr-2"
                />
                Inclure inactives
              </label>
              <Button variant="outline" onClick={fetchAPIKeys}>
                Actualiser
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {apiKeys.length === 0
                  ? 'Aucune clé API trouvée'
                  : 'Aucune clé API ne correspond à votre recherche'}
              </p>
            </div>
          ) : (
            <DataTable
              data={filteredKeys as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              searchable={false}
              pageSize={20}
            />
          )}
        </Card>
      </Section>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedKey(null);
        }}
        title="Révoquer la clé API"
        size="md"
      >
        {selectedKey && (
          <div className="space-y-4">
            <p>
              Êtes-vous sûr de vouloir révoquer la clé API <strong>{selectedKey.name}</strong> de{' '}
              <strong>{selectedKey.user_email}</strong> ?
            </p>
            <p className="text-sm text-muted-foreground">
              Cette action est irréversible. La clé API sera immédiatement désactivée.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedKey(null);
                }}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Révoquer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
