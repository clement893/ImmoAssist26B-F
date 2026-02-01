'use client';
import { Card } from '@/components/ui';
import { User } from 'lucide-react';
import type { Contact } from '@/lib/api/reseau-contacts';
interface ContactsGalleryProps {
  contacts?: Contact[];
  onContactClick?: (contact: Contact) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}
export default function ContactsGallery({
  contacts = [],
  onContactClick,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: ContactsGalleryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {' '}
      {contacts.length === 0 ? (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          {' '}
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" /> <p>Aucun contact trouvé</p>{' '}
        </div>
      ) : (
        <>
          {' '}
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-4 cursor-pointer hover:shadow-standard-md transition-modern" // UI Revamp - Transition moderne, shadow-standard-md
              onClick={() => onContactClick?.(contact)}
            >
              {' '}
              <div className="flex items-center gap-3">
                {' '}
                {contact.photo_url ? (
                  <img
                    src={contact.photo_url}
                    alt={`${contact.first_name} ${contact.last_name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    {' '}
                    <User className="w-6 h-6 text-muted-foreground" />{' '}
                  </div>
                )}{' '}
                <div className="flex-1 min-w-0">
                  {' '}
                  <h3 className="font-medium truncate">
                    {' '}
                    {contact.first_name} {contact.last_name}{' '}
                  </h3>{' '}
                  {contact.email && (
                    <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                  )}{' '}
                  {contact.company_name && (
                    <p className="text-xs text-muted-foreground truncate">{contact.company_name}</p>
                  )}{' '}
                </div>{' '}
              </div>{' '}
            </Card>
          ))}{' '}
          {hasMore && onLoadMore && (
            <div className="col-span-full flex justify-center py-4">
              {' '}
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm text-primary hover:text-primary-600 disabled:opacity-50"
              >
                {' '}
                {loadingMore ? 'Chargement...' : 'Charger plus'}{' '}
              </button>{' '}
            </div>
          )}{' '}
        </>
      )}{' '}
    </div>
  );
}
