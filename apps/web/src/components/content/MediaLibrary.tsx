/**
 * Media Library Component
 *
 * Media file management with grid/gallery/list views.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { Card, Button, FileUpload, Badge, Modal, Input, Alert } from '@/components/ui';
import {
  Upload,
  Grid3x3,
  List,
  Image as ImageIcon,
  Video,
  File,
  Search,
  Trash2,
  Eye,
} from 'lucide-react';

export interface MediaItem extends Record<string, unknown> {
  id: number;
  name: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'audio' | 'other';
  mime_type: string;
  size: number;
  width?: number;
  height?: number;
  created_at: string;
  updated_at: string;
}

export type ViewMode = 'grid' | 'gallery' | 'list';

export interface MediaLibraryProps {
  media?: MediaItem[];
  onUpload?: (files: File[]) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  onSelect?: (media: MediaItem) => void;
  className?: string;
}

/**
 * Media Library Component
 *
 * Displays media files in grid, gallery, or list view with upload functionality.
 */
export default function MediaLibrary({
  media = [],
  onUpload,
  onDelete,
  onSelect,
  className,
}: MediaLibraryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const filteredMedia = media.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getMediaIcon = (item: MediaItem) => {
    switch (item.type) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />;
      case 'video':
        return <Video className="w-5 h-5 text-danger-600 dark:text-danger-400" />;
      case 'audio':
        return <File className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />;
      default:
        return <File className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const handleUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      setError(null);
      if (onUpload) {
        await onUpload(files);
      }
      setIsUploadModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this media file?')) {
      return;
    }
    try {
      if (onDelete) {
        await onDelete(id);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete media');
    }
  };

  const handleSelect = (item: MediaItem) => {
    if (onSelect) {
      onSelect(item);
    } else {
      setSelectedMedia(item);
    }
  };

  return (
    <div className={className}>
      <Card title="Media Library">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search media..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none border-0"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'gallery' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('gallery')}
                className="rounded-none border-0"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-none border-0"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {/* Media Display */}
        {filteredMedia.length === 0 ? (
          <div className="text-center py-12">
            <File className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No media files found</p>
            <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="group relative border border-border rounded-lg overflow-hidden hover:shadow-standard-lg transition-modern cursor-pointer" // UI Revamp - Nouveau système d'ombres et transition moderne
                    onClick={() => handleSelect(item)}
                  >
                    {item.type === 'image' ? (
                      <div className="aspect-square relative bg-muted">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-foreground bg-opacity-0 group-hover:bg-opacity-50 transition-modern flex items-center justify-center gap-2"> // UI Revamp - Transition moderne
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(item);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-background"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-background"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-square flex flex-col items-center justify-center bg-muted p-4">
                        {getMediaIcon(item)}
                        <p className="text-xs text-muted-foreground mt-2 text-center truncate w-full">
                          {item.name}
                        </p>
                      </div>
                    )}
                    <div className="p-2 bg-background">
                      <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'gallery' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedia
                  .filter((item) => item.type === 'image')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="group relative border border-border rounded-lg overflow-hidden hover:shadow-standard-lg transition-modern cursor-pointer" // UI Revamp - Nouveau système d'ombres et transition moderne
                      onClick={() => handleSelect(item)}
                    >
                      <div className="aspect-video relative bg-muted">
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-foreground bg-opacity-0 group-hover:bg-opacity-50 transition-modern flex items-center justify-center gap-2"> // UI Revamp - Transition moderne
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(item);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-background"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-background"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 bg-background">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(item.size)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-2">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-modern cursor-pointer" // UI Revamp - Transition moderne
                    onClick={() => handleSelect(item)}
                  >
                    <div className="flex-shrink-0">
                      {item.type === 'image' ? (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
                          {getMediaIcon(item)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default">{item.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(item.size)}
                        </span>
                        {item.width && item.height && (
                          <span className="text-xs text-muted-foreground">
                            {item.width} × {item.height}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-danger-600 dark:text-danger-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Media"
        size="lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FileUpload
            accept="image/*,video/*,audio/*,application/pdf"
            multiple
            onFileSelect={handleUpload}
            helperText="Supported: Images (no size limit), Videos, Audio, PDF (max 50MB)"
          />
          {isUploading && <Alert variant="info">Uploading files...</Alert>}
        </div>
      </Modal>

      {/* Media Preview Modal */}
      {selectedMedia && !onSelect && (
        <Modal
          isOpen={!!selectedMedia}
          onClose={() => setSelectedMedia(null)}
          title={selectedMedia.name}
          size="xl"
        >
          <div className="space-y-4">
            {selectedMedia.type === 'image' && (
              <img src={selectedMedia.url} alt={selectedMedia.name} className="w-full rounded-lg" />
            )}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium text-foreground">{selectedMedia.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Size</p>
                <p className="font-medium text-foreground">{formatFileSize(selectedMedia.size)}</p>
              </div>
              {selectedMedia.width && selectedMedia.height && (
                <>
                  <div>
                    <p className="text-muted-foreground">Dimensions</p>
                    <p className="font-medium text-foreground">
                      {selectedMedia.width} × {selectedMedia.height}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedMedia.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
