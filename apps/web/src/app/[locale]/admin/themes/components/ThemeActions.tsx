'use client';

/**
 * ThemeActions Component
 * Handles theme actions with confirmation modals
 */

import { useState } from 'react';
import { activateTheme, deleteTheme } from '@/lib/api/theme';
import { clearThemeCache } from '@/lib/theme/theme-cache';
import { useGlobalTheme } from '@/lib/theme/global-theme-provider';
import { Modal, Button, Alert } from '@/components/ui';
import { logger } from '@/lib/logger';
import type { Theme } from '@modele/types';

export function useThemeActions() {
  const [isActivating, setIsActivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const { refreshTheme } = useGlobalTheme();

  const handleActivateClick = (theme: Theme) => {
    setSelectedTheme(theme);
    setShowActivateModal(true);
  };

  const handleDeleteClick = (theme: Theme) => {
    setSelectedTheme(theme);
    setShowDeleteModal(true);
  };

  const confirmActivate = async (): Promise<{ success: boolean; message: string }> => {
    if (!selectedTheme) {
      return { success: false, message: 'Aucun thème sélectionné' };
    }

    try {
      setIsActivating(true);

      // Clear cache FIRST to prevent stale cache from being used
      clearThemeCache();

      // Activate theme on backend
      await activateTheme(selectedTheme.id);

      // Immediately refresh theme (force apply) - no delays needed
      // The refreshTheme function already handles force apply
      // Don't await - let it run in parallel for instant UI update
      refreshTheme().catch((err) => {
        logger.error('[ThemeActions] Error refreshing theme after activation', err);
      });

      setShowActivateModal(false);
      const themeName = selectedTheme.display_name;
      setSelectedTheme(null);

      return { success: true, message: `Thème "${themeName}" activé avec succès !` };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Erreur lors de l'activation du thème";
      return { success: false, message: errorMessage };
    } finally {
      setIsActivating(false);
    }
  };

  const confirmDelete = async (): Promise<{ success: boolean; message: string }> => {
    if (!selectedTheme) {
      return { success: false, message: 'Aucun thème sélectionné' };
    }

    try {
      setIsDeleting(true);
      await deleteTheme(selectedTheme.id);

      setShowDeleteModal(false);
      const themeName = selectedTheme.display_name;
      setSelectedTheme(null);

      return { success: true, message: `Thème "${themeName}" supprimé avec succès !` };
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Erreur lors de la suppression du thème';
      return { success: false, message: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelAction = () => {
    setShowActivateModal(false);
    setShowDeleteModal(false);
    setSelectedTheme(null);
  };

  return {
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
  };
}

interface ConfirmActivateModalProps {
  theme: Theme;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
}

export function ConfirmActivateModal({
  theme,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmActivateModalProps) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConfirm = async () => {
    const res = await onConfirm();
    setResult(res);
    if (res.success) {
      setTimeout(() => {
        onCancel();
        setResult(null);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Activer le thème">
      <div className="space-y-4">
        {result ? (
          <Alert
            variant={result.success ? 'success' : 'error'}
            title={result.success ? 'Succès' : 'Erreur'}
          >
            {result.message}
          </Alert>
        ) : (
          <>
            <p className="text-foreground">
              Êtes-vous sûr de vouloir activer le thème <strong>"{theme.display_name}"</strong> ?
            </p>
            <p className="text-sm text-muted-foreground">
              Ce thème remplacera le thème actuellement actif et sera appliqué sur toute la
              plateforme.
            </p>
            <div className="flex gap-3 justify-end mt-6">
              <Button onClick={onCancel} variant="outline" disabled={isLoading}>
                Annuler
              </Button>
              <Button onClick={handleConfirm} variant="primary" disabled={isLoading}>
                {isLoading ? 'Activation...' : 'Activer'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

interface ConfirmDeleteModalProps {
  theme: Theme;
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => Promise<{ success: boolean; message: string }>;
  onCancel: () => void;
}

export function ConfirmDeleteModal({
  theme,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleConfirm = async () => {
    const res = await onConfirm();
    setResult(res);
    if (res.success) {
      setTimeout(() => {
        onCancel();
        setResult(null);
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Supprimer le thème">
      <div className="space-y-4">
        {result ? (
          <Alert
            variant={result.success ? 'success' : 'error'}
            title={result.success ? 'Succès' : 'Erreur'}
          >
            {result.message}
          </Alert>
        ) : (
          <>
            <Alert variant="warning" title="Attention">
              Cette action est irréversible. Le thème <strong>"{theme.display_name}"</strong> sera
              définitivement supprimé.
            </Alert>
            {theme.is_active && (
              <Alert variant="error" title="Impossible de supprimer">
                Ce thème est actuellement actif. Veuillez d'abord activer un autre thème.
              </Alert>
            )}
            <div className="flex gap-3 justify-end mt-6">
              <Button onClick={onCancel} variant="outline" disabled={isLoading || theme.is_active}>
                Annuler
              </Button>
              <Button
                onClick={handleConfirm}
                variant="danger"
                disabled={isLoading || theme.is_active}
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
