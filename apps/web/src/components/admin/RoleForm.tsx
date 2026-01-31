/**
 * Role Form Component
 * Form for creating or editing a role
 */
'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { type Role, type RoleCreate, type RoleUpdate } from '@/lib/api/rbac';
import { logger } from '@/lib/logger';

export interface RoleFormProps {
  role?: Role | null;
  onSubmit: (data: RoleCreate | RoleUpdate) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export default function RoleForm({ role, onSubmit, onCancel, loading = false }: RoleFormProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role) {
      setName(role.name);
      setSlug(role.slug);
      setDescription(role.description || '');
    } else {
      setName('');
      setSlug('');
      setDescription('');
    }
    setError(null);
  }, [role]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    // Auto-generate slug if creating new role
    if (!role) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Le nom du rôle est requis');
      return;
    }

    if (!slug.trim()) {
      setError('Le slug du rôle est requis');
      return;
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets');
      return;
    }

    try {
      if (role) {
        // Update existing role
        await onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
        });
      } else {
        // Create new role
        await onSubmit({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          is_system: false,
        });
      }
    } catch (err) {
      logger.error('Failed to save role', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde du rôle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <Input
          label="Nom du rôle *"
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: Éditeur"
          fullWidth
          disabled={loading || role?.is_system}
          required
        />
        {role?.is_system && <p className="text-xs text-muted-foreground mt-1">Les rôles système ne peuvent pas être modifiés</p>}
      </div>

      <div>
        <Input
          label="Slug *"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="ex: editeur"
          fullWidth
          disabled={loading || !!role}
          required
          pattern="[a-z0-9-]+"
        />
        {role && <p className="text-xs text-muted-foreground mt-1">Le slug ne peut pas être modifié après la création</p>}
        {!role && (
          <p className="text-xs text-muted-foreground mt-1">Identifiant unique pour le rôle (généré automatiquement depuis le nom)</p>
        )}
      </div>

      <div>
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Description du rôle..."
          fullWidth
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={loading || !name.trim() || !slug.trim()}>
          {loading ? 'Enregistrement...' : role ? 'Modifier' : 'Créer'}
        </Button>
      </div>
    </form>
  );
}
