'use client';

/**
 * ThemeListItem Component
 * Displays a single theme item in the list
 */

import type { ThemeListItem as ThemeListItemType } from '../types';
import { Button, Badge } from '@/components/ui';
import { Edit, Trash2, CheckCircle2, Copy, Power } from 'lucide-react';
// Simple date formatting without date-fns dependency
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('fr-FR', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return dateString;
  }
};

interface ThemeListItemProps {
  theme: ThemeListItemType;
  onEdit: () => void;
  onDelete: () => void;
  onActivate: () => void;
  onDuplicate: () => void;
}

export function ThemeListItem({
  theme,
  onEdit,
  onDelete,
  onActivate,
  onDuplicate,
}: ThemeListItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-foreground">{theme.display_name}</h3>
          {theme.isActive && (
            <Badge variant="success" className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Actif
            </Badge>
          )}
        </div>
        {theme.description && (
          <p className="text-sm text-muted-foreground mt-1">{theme.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>ID: {theme.id}</span>
          <span>•</span>
          <span>Créé le {formatDate(theme.created_at)}</span>
          {theme.updated_at !== theme.created_at && (
            <>
              <span>•</span>
              <span>Modifié le {formatDate(theme.updated_at)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {!theme.isActive && (
          <Button onClick={onActivate} variant="primary" size="sm" title="Activer ce thème">
            <Power className="w-4 h-4 mr-1" />
            Activer
          </Button>
        )}
        <Button onClick={onEdit} variant="outline" size="sm" title="Éditer ce thème">
          <Edit className="w-4 h-4 mr-1" />
          Éditer
        </Button>
        <Button onClick={onDuplicate} variant="outline" size="sm" title="Dupliquer ce thème">
          <Copy className="w-4 h-4 mr-1" />
          Dupliquer
        </Button>
        {theme.canDelete && (
          <Button onClick={onDelete} variant="danger" size="sm" title="Supprimer ce thème">
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}
