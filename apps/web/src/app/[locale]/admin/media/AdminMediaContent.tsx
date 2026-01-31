'use client';

import { useEffect, useState, useRef } from 'react';
import { PageHeader, PageContainer } from '@/components/layout';
import { getErrorMessage } from '@/lib/errors';
import { Button, Card, Badge, Alert, Input, Loading, Modal, DataTable } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Trash2, Upload, Image, File, Video, Music, FileText } from 'lucide-react';
import { mediaAPI, type Media } from '@/lib/api/media';
import { logger } from '@/lib/logger';

export default function AdminMediaContent() {
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      setError(null);
      const mediaData = await mediaAPI.list(0, 100);
      logger.debug('[AdminMedia] Loaded media files', { count: mediaData.length });
      setMediaFiles(mediaData);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Erreur lors du chargement des fichiers média');
      logger.error(
        '[AdminMedia] Error loading media',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMedia) return;

    try {
      setError(null);
      await mediaAPI.delete(selectedMedia.id);
      logger.info('[AdminMedia] Media file deleted', {
        id: selectedMedia.id,
        filename: selectedMedia.filename,
      });
      setMediaFiles(mediaFiles.filter((m) => m.id !== selectedMedia.id));
      setDeleteModalOpen(false);
      setSelectedMedia(null);
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Erreur lors de la suppression du fichier');
      logger.error(
        '[AdminMedia] Error deleting media',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const uploadedMedia = await mediaAPI.upload(file, { is_public: false });
      logger.info('[AdminMedia] Media file uploaded', {
        id: uploadedMedia.id,
        filename: uploadedMedia.filename,
      });
      setMediaFiles([uploadedMedia, ...mediaFiles]);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, "Erreur lors de l'upload du fichier");
      logger.error(
        '[AdminMedia] Error uploading media',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getMediaIcon = (mimeType?: string) => {
    if (!mimeType) return <File className="w-4 h-4" />;
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType.includes('pdf') || mimeType.includes('document'))
      return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const filteredMedia = mediaFiles.filter(
    (media) =>
      media.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      media.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      media.mime_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Column<Media>[] = [
    {
      key: 'filename',
      label: 'Fichier',
      render: (_value, media) => (
        <div className="flex items-center gap-2">
          {getMediaIcon(media.mime_type)}
          <span className="font-medium text-foreground">{media.filename}</span>
        </div>
      ),
    },
    {
      key: 'file_path',
      label: 'Chemin',
      render: (_value, media) => (
        <span className="text-sm text-muted-foreground font-mono">{media.file_path}</span>
      ),
    },
    {
      key: 'file_size',
      label: 'Taille',
      render: (_value, media) => (
        <span className="text-sm text-muted-foreground">{formatFileSize(media.file_size)}</span>
      ),
    },
    {
      key: 'mime_type',
      label: 'Type',
      render: (_value, media) => (
        <span className="text-sm text-muted-foreground">{media.mime_type || 'N/A'}</span>
      ),
    },
    {
      key: 'is_public',
      label: 'Visibilité',
      render: (_value, media) => (
        <Badge variant={media.is_public ? 'success' : 'default'}>
          {media.is_public ? 'Public' : 'Privé'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Créé le',
      render: (_value, media) => (
        <span className="text-sm text-muted-foreground">
          {new Date(media.created_at).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value, media) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedMedia(media);
              setDeleteModalOpen(true);
            }}
            aria-label="Supprimer le fichier"
            title="Supprimer le fichier"
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
        title="Gestion des médias"
        description="Gérer les fichiers média du site"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Médias' },
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
            placeholder="Rechercher un fichier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="primary"
            disabled={uploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Upload en cours...' : 'Uploader un fichier'}
          </Button>
          <Button onClick={loadMedia} variant="outline">
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
              data={filteredMedia as unknown as Record<string, unknown>[]}
              columns={columns as unknown as Column<Record<string, unknown>>[]}
              emptyMessage="Aucun fichier média trouvé"
            />
          </Card>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedMedia(null);
        }}
        title="Supprimer le fichier"
      >
        <div className="space-y-4">
          <p className="text-foreground">
            Êtes-vous sûr de vouloir supprimer le fichier <strong>{selectedMedia?.filename}</strong>{' '}
            ?
          </p>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedMedia(null);
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
