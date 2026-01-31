'use client';
import { type Contact } from '@/lib/api/reseau-contacts';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
interface ContactRowActionsProps {
  contact: Contact;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}
export default function ContactRowActions({
  contact,
  onView,
  onEdit,
  onDelete,
}: ContactRowActionsProps) {
  const contactName = `${contact.first_name} ${contact.last_name}`;
  return (
    <div className="flex items-center gap-1">
      {' '}
      <Button
        size="sm"
        variant="ghost"
        onClick={onView}
        className="h-7 w-7 p-0"
        aria-label={`Voir ${contactName}`}
      >
        <Eye className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-7 w-7 p-0"
        aria-label={`Modifier ${contactName}`}
      >
        <Edit className="w-3.5 h-3.5" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={onDelete}
        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
        aria-label={`Supprimer ${contactName}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>{' '}
    </div>
  );
}
