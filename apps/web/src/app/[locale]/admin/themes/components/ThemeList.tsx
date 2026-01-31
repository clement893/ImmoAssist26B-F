'use client';

/**
 * ThemeList Component
 * Displays a list of all themes with their status and actions
 */

import { useEffect, useState } from 'react';
import { listThemes } from '@/lib/api/theme';
import type { Theme } from '@modele/types';
import type { ThemeListItem } from '../types';
import { Card, Button, Loading, Alert } from '@/components/ui';
import { Plus } from 'lucide-react';
import { ThemeListItem as ThemeListItemComponent } from './ThemeListItem';
import { useThemeActions, ConfirmActivateModal, ConfirmDeleteModal } from './ThemeActions';
import { logger } from '@/lib/logger';

interface ThemeListProps {
  onCreateTheme: () => void;
  onEditTheme: (theme: Theme) => void;
  onDeleteTheme: (theme: Theme) => void;
  onActivateTheme: (theme: Theme) => void;
  onDuplicateTheme: (theme: Theme) => void;
}

export function ThemeList({
  onCreateTheme,
  onEditTheme,
  onDeleteTheme,
  onActivateTheme,
  onDuplicateTheme,
}: ThemeListProps) {
  const [themes, setThemes] = useState<ThemeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    isActivating,
    isDeleting,
    showActivateModal,
    showDeleteModal,
    selectedTheme,
    handleActivateClick,
    handleDeleteClick,
    confirmActivate,
    confirmDelete,
    cancelAction,
  } = useThemeActions();

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listThemes();
      const themesList = response.themes || [];
      const activeId = response.active_theme_id || null;

      // Transform themes to ThemeListItem with UI properties
      const themesWithUI: ThemeListItem[] = themesList.map((theme) => ({
        ...theme,
        isActive: theme.id === activeId,
        canDelete: !theme.is_active, // Can't delete active theme
        canEdit: true, // All themes can be edited
      }));

      setThemes(themesWithUI);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors du chargement des thèmes';
      setError(errorMessage);
      logger.error(
        '[ThemeList] Error fetching themes',
        err instanceof Error ? err : new Error(String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (theme: Theme) => {
    handleActivateClick(theme);
  };

  const handleDelete = async (theme: Theme) => {
    handleDeleteClick(theme);
  };

  const handleActivateConfirm = async (): Promise<{ success: boolean; message: string }> => {
    const result = await confirmActivate();
    if (result.success && selectedTheme) {
      // Optimistically update UI immediately - no waiting for API refresh
      setThemes((prevThemes) =>
        prevThemes.map((theme) => ({
          ...theme,
          isActive: theme.id === selectedTheme.id, // Set new active theme
          canDelete: theme.id !== selectedTheme.id, // Can't delete active theme
        }))
      );

      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh list in background to sync with backend (non-blocking)
      fetchThemes().catch((err) => {
        logger.error('[ThemeList] Error refreshing themes after activation', err);
        // If refresh fails, revert optimistic update
        fetchThemes();
      });

      if (selectedTheme) {
        onActivateTheme(selectedTheme);
      }
    } else {
      setError(result.message);
      setTimeout(() => setError(null), 5000);
    }
    return result;
  };

  const handleDeleteConfirm = async (): Promise<{ success: boolean; message: string }> => {
    const result = await confirmDelete();
    if (result.success) {
      setSuccessMessage(result.message);
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchThemes(); // Refresh list
      if (selectedTheme) {
        onDeleteTheme(selectedTheme);
      }
    } else {
      setError(result.message);
      setTimeout(() => setError(null), 5000);
    }
    return result;
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 flex items-center justify-center">
          <Loading />
          <span className="ml-2 text-muted-foreground">Chargement des thèmes...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Erreur">
        {error}
        <Button onClick={fetchThemes} variant="primary" className="mt-4" size="sm">
          Réessayer
        </Button>
      </Alert>
    );
  }

  return (
    <>
      {successMessage && (
        <Alert variant="success" title="Succès" className="mb-4">
          {successMessage}
        </Alert>
      )}

      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Thèmes</h2>
              <p className="text-muted-foreground mt-1">
                {themes.length} thème{themes.length > 1 ? 's' : ''} disponible
                {themes.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={onCreateTheme} variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Créer un thème
            </Button>
          </div>

          {themes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Aucun thème disponible</p>
              <Button onClick={onCreateTheme} variant="primary">
                <Plus className="w-4 h-4 mr-2" />
                Créer le premier thème
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {themes.map((theme) => (
                <ThemeListItemComponent
                  key={theme.id}
                  theme={theme}
                  onEdit={() => onEditTheme(theme)}
                  onDelete={() => handleDelete(theme)}
                  onActivate={() => handleActivate(theme)}
                  onDuplicate={() => onDuplicateTheme(theme)}
                />
              ))}
            </div>
          )}
        </div>
      </Card>

      {selectedTheme && (
        <>
          <ConfirmActivateModal
            theme={selectedTheme}
            isOpen={showActivateModal}
            isLoading={isActivating}
            onConfirm={handleActivateConfirm}
            onCancel={cancelAction}
          />
          <ConfirmDeleteModal
            theme={selectedTheme}
            isOpen={showDeleteModal}
            isLoading={isDeleting}
            onConfirm={handleDeleteConfirm}
            onCancel={cancelAction}
          />
        </>
      )}
    </>
  );
}
