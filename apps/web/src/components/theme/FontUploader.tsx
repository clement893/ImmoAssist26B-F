/**
 * FontUploader Component
 * Component for uploading and managing custom fonts for themes
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { uploadFont, listFonts, deleteFont } from '@/lib/api/theme-font';
import type { ThemeFont } from '@modele/types';
import { Card, Button, Alert } from '@/components/ui';
import FileUpload from '@/components/ui/FileUpload';
import { Trash2, Check, Loader2, Type } from 'lucide-react';
import { logger } from '@/lib/logger';

interface FontUploaderProps {
  /** Selected font IDs for the theme */
  selectedFontIds?: number[];
  /** Callback when font selection changes */
  onFontSelectionChange?: (fontIds: number[]) => void;
  /** Whether to show selection checkboxes */
  showSelection?: boolean;
}

export function FontUploader({
  selectedFontIds = [],
  onFontSelectionChange,
  showSelection = true,
}: FontUploaderProps) {
  const [fonts, setFonts] = useState<ThemeFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedFontIds);

  // Load fonts on mount
  useEffect(() => {
    loadFonts();
  }, []);

  // Sync selectedIds with prop
  useEffect(() => {
    setSelectedIds(selectedFontIds);
  }, [selectedFontIds]);

  const loadFonts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listFonts();
      setFonts(response.fonts || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des polices';
      setError(errorMessage);
      logger.error('[FontUploader] Failed to load fonts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleFileSelect = async (files: File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    // Upload one at a time for now
    if (!file) return; // Type guard
    setUploading(true);
    setError(null);
    try {
      // Extract font name from filename
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const fontName = filenameWithoutExt
        .replace(/[-_]/g, '')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      const uploadedFont = await uploadFont(file, {
        name: fontName,
        font_family: fontName,
      });

      // Reload fonts list
      await loadFonts();

      // Auto-select uploaded font if selection is enabled
      if (showSelection && onFontSelectionChange) {
        const newSelection = [...selectedIds, uploadedFont.id];
        setSelectedIds(newSelection);
        onFontSelectionChange(newSelection);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur lors de l'upload de la police";
      setError(errorMessage);
      logger.error('[FontUploader] Failed to upload font', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fontId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette police ?')) {
      return;
    }
    try {
      await deleteFont(fontId);
      // Remove from selection if selected
      const newSelection = selectedIds.filter((id) => id !== fontId);
      setSelectedIds(newSelection);
      if (onFontSelectionChange) {
        onFontSelectionChange(newSelection);
      }
      // Reload fonts list
      await loadFonts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      logger.error('[FontUploader] Failed to delete font', err);
    }
  };

  const handleToggleSelection = (fontId: number) => {
    if (!showSelection || !onFontSelectionChange) return;
    const newSelection = selectedIds.includes(fontId)
      ? selectedIds.filter((id) => id !== fontId)
      : [...selectedIds, fontId];
    setSelectedIds(newSelection);
    onFontSelectionChange(newSelection);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Type className="w-5 h-5" />
          Gestion des Polices
        </h3>
        <p className="text-sm text-muted-foreground">
          Téléchargez des fichiers de polices personnalisées (.woff2, .woff, .ttf, .otf) pour les utiliser dans vos
          thèmes.
        </p>
      </div>

      {error && (
        <Alert variant="error" title="Erreur" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Upload Zone */}
      <Card>
        <div className="p-4">
          <FileUpload
            accept=".woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf"
            allowedTypes={['.woff2', '.woff', '.ttf', '.otf']}
            maxSize={5} // 5MB
            onFileSelect={handleFileSelect}
            label="Télécharger une police"
            helperText="Formats acceptés: .woff2, .woff, .ttf, .otf (max 5MB)"
            disabled={uploading}
          />
          {uploading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Téléchargement en cours...</span>
            </div>
          )}
        </div>
      </Card>

      {/* Fonts List */}
      <div>
        <h4 className="text-md font-semibold text-foreground mb-3">Polices Disponibles ({fonts.length})</h4>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : fonts.length === 0 ? (
          <Card>
            <div className="p-8 text-center">
              <Type className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Aucune police téléchargée. Utilisez le formulaire ci-dessus pour en ajouter une.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {fonts.map((font) => {
              const isSelected = selectedIds.includes(font.id);
              return (
                <Card key={font.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {showSelection && (
                          <button
                            onClick={() => handleToggleSelection(font.id)}
                            className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-modern ${ // UI Revamp - Transition moderne
                              isSelected
                                ? 'bg-primary border-primary text-background'
                                : 'border-border hover:border-primary'
                            }`}
                            aria-label={isSelected ? 'Désélectionner' : 'Sélectionner'}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </button>
                        )}
                        <h5 className="font-semibold text-foreground truncate">{font.name}</h5>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-mono">{font.font_family}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="px-2 py-1 bg-muted rounded">{font.font_format.toUpperCase()}</span>
                        {font.font_weight && font.font_weight !== 'normal' && (
                          <span className="px-2 py-1 bg-muted rounded">{font.font_weight}</span>
                        )}
                        {font.font_style && font.font_style !== 'normal' && (
                          <span className="px-2 py-1 bg-muted rounded">{font.font_style}</span>
                        )}
                        <span className="px-2 py-1 bg-muted rounded">{formatFileSize(font.file_size)}</span>
                      </div>
                      {font.description && (
                        <p className="text-xs text-muted-foreground mt-2">{font.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(font.id)}
                      className="flex-shrink-0"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-danger-500" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
