'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, PageContainer } from '@/components/layout';
import { getErrorMessage } from '@/lib/errors';
import { Button, Card, Badge, Alert, Input, Loading, Modal, DataTable } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Edit2, Trash2, Eye, Plus, FileText } from 'lucide-react';
import { pagesAPI, type Page } from '@/lib/api/pages';
import { logger } from '@/lib/logger';

export default function AdminPagesContent() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      setLoading(true);
      setError(null);
      const pagesData = await pagesAPI.list(0, 100);
      logger.debug('[AdminPages] Loaded pages', { count: pagesData.length });
      setPages(pagesData);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Erreur lors du chargement des pages');
      logger.error(
        '[AdminPages] Error loading pages',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPage) return;

    try {
      setError(null);
      await pagesAPI.delete(selectedPage.id);
      logger.info('[AdminPages] Page deleted', { id: selectedPage.id, slug: selectedPage.slug });
      setPages(pages.filter((p) => p.id !== selectedPage.id));
      setDeleteModalOpen(false);
      setSelectedPage(null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Erreur lors de la suppression de la page');
      logger.error(
        '[AdminPages] Error deleting page',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
    }
  };

  const handleView = (page: Page) => {
    router.push(`/pages/${page.slug}`);
  };

  const handleEdit = (page: Page) => {
    router.push(`/pages/${page.slug}/edit`);
  };

  const handleCreate = () => {
    router.push('/content/pages');
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: Column<Page>[] = [
    {
      key: 'title',
      label: 'Titre',
      render: (_value, page) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium text-foreground">{page.title}</span>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      render: (_value, page) => (
        <span className="text-sm text-muted-foreground font-mono">/{page.slug}</span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (_value, page) => (
        <Badge variant={getStatusBadgeVariant(page.status)}>
          {page.status === 'published'
            ? 'Publié'
            : page.status === 'draft'
              ? 'Brouillon'
              : 'Archivé'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (_value, page) => (
        <span className="text-sm text-muted-foreground">
          {new Date(page.created_at).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, page) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(page)}
            aria-label="Voir la page"
            title="Voir la page"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(page)}
            aria-label="Modifier la page"
            title="Modifier la page"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPage(page);
              setDeleteModalOpen(true);
            }}
            aria-label="Supprimer la page"
            title="Supprimer la page"
            className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-300"
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
        title="Gestion des pages"
        description="Gérer les pages de contenu du site"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Pages' },
        ]}
      />

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 space-y-4">
        <div className="flex gap-4 items-center flex-wrap">
          <Input
            type="text"
            placeholder="Rechercher une page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={handleCreate} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Créer une page
          </Button>
          <Button onClick={loadPages} variant="outline">
            Actualiser
          </Button>
        </div>

        {loading ? (
          <Card>
            <div className="py-12 text-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <Card>
            <DataTable
              data={filteredPages as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              emptyMessage="Aucune page trouvée"
            />
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedPage(null);
        }}
        title="Supprimer la page"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Êtes-vous sûr de vouloir supprimer la page <strong>{selectedPage?.title}</strong> ?
          </p>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedPage(null);
              }}
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
