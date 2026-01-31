'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reseauContactsAPI } from '@/lib/api/reseau-contacts';
import type { Contact } from '@/lib/api/reseau-contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import ContactDetail from '@/components/reseau/ContactDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_deleting, setDeleting] = useState(false);

  const contactId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (!contactId) {
      setError('ID de contact invalide');
      setLoading(false);
      return;
    }

    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    if (!contactId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await reseauContactsAPI.get(contactId);
      setContact(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors du chargement du contact');
      showToast({
        message: appError.message || 'Erreur lors du chargement du contact',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (contact) {
      const locale = (params?.locale as string) || 'fr';
      router.push(`/${locale}/dashboard/reseau/contacts/${contact.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!contact || !confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      setDeleting(true);
      await reseauContactsAPI.delete(contact.id);
      showToast({
        message: 'Contact supprimé avec succès',
        type: 'success',
      });
      const locale = (params?.locale as string) || 'fr';
      router.push(`/${locale}/dashboard/reseau/contacts`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la suppression');
      showToast({
        message: appError.message || 'Erreur lors de la suppression',
        type: 'error',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="py-12 text-center">
          <Loading />
        </div>
      </PageContainer>
    );
  }

  if (error && !contact) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Réseau', href: `/${params?.locale || 'fr'}/dashboard/reseau` },
            { label: 'Contacts', href: `/${params?.locale || 'fr'}/dashboard/reseau/contacts` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const locale = (params?.locale as string) || 'fr';
              router.push(`/${locale}/dashboard/reseau/contacts`);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!contact) {
    return (
      <PageContainer>
        <PageHeader
          title="Contact non trouvé"
          breadcrumbs={[
            { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
            { label: 'Module Réseau', href: `/${params?.locale || 'fr'}/dashboard/reseau` },
            { label: 'Contacts', href: `/${params?.locale || 'fr'}/dashboard/reseau/contacts` },
            { label: 'Détail' },
          ]}
        />
        <Alert variant="error">Le contact demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              const locale = (params?.locale as string) || 'fr';
              router.push(`/${locale}/dashboard/reseau/contacts`);
            }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleBack = () => {
    const locale = (params?.locale as string) || 'fr';
    router.push(`/${locale}/dashboard/reseau/contacts`);
  };

  return (
    <PageContainer>
      <PageHeader
        title={`${contact.first_name} ${contact.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${params?.locale || 'fr'}/dashboard` },
          { label: 'Module Réseau', href: `/${params?.locale || 'fr'}/dashboard/reseau` },
          { label: 'Contacts', href: `/${params?.locale || 'fr'}/dashboard/reseau/contacts` },
          { label: `${contact.first_name} ${contact.last_name}` },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la liste
          </Button>
        }
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <ContactDetail contact={contact} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </PageContainer>
  );
}
