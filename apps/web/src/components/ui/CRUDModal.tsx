'use client';
import { ReactNode } from 'react';
import Modal from './Modal';
import Button from './Button';
export interface CRUDModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  onSubmit?: () => void;
  onDelete?: () => void;
  mode: 'create' | 'edit' | 'delete' | 'view';
  loading?: boolean;
  submitLabel?: string;
  deleteLabel?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
export default function CRUDModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  onDelete,
  mode,
  loading = false,
  submitLabel,
  deleteLabel,
  size = 'md',
}: CRUDModalProps) {
  const getSubmitLabel = () => {
    if (submitLabel) return submitLabel;
    switch (mode) {
      case 'create':
        return 'Créer';
      case 'edit':
        return 'Enregistrer';
      default:
        return 'Valider';
    }
  };
  const getDeleteLabel = () => {
    return deleteLabel || 'Supprimer';
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      {' '}
      <div className="space-y-6">
        {' '}
        {mode === 'delete' ? (
          <div className="text-center py-4">
            {' '}
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100 dark:bg-error-900/30 mb-4">
              {' '}
              <svg
                className="h-6 w-6 text-error-600 dark:text-error-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {' '}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />{' '}
              </svg>{' '}
            </div>{' '}
            <h3 className="text-lg font-medium text-foreground mb-2"> Êtes-vous sûr ? </h3>{' '}
            <p className="text-sm text-muted-foreground">
              {' '}
              Cette action est irréversible. Cette donnée sera définitivement supprimée.{' '}
            </p>{' '}
          </div>
        ) : (
          <div>{children}</div>
        )}{' '}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          {' '}
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {' '}
            Annuler{' '}
          </Button>{' '}
          {mode === 'delete' && onDelete && (
            <Button variant="danger" onClick={onDelete} disabled={loading}>
              {' '}
              {getDeleteLabel()}{' '}
            </Button>
          )}{' '}
          {(mode === 'create' || mode === 'edit') && onSubmit && (
            <Button variant="primary" onClick={onSubmit} disabled={loading}>
              {' '}
              {loading ? 'Chargement...' : getSubmitLabel()}{' '}
            </Button>
          )}{' '}
        </div>{' '}
      </div>{' '}
    </Modal>
  );
}
