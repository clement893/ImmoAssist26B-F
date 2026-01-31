'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { reseauContactsAPI } from '@/lib/api/reseau-contacts';
import type { Contact, ContactCreate, ContactUpdate } from '@/lib/api/reseau-contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import ContactForm from '@/components/reseau/ContactForm';
import { Loading, Alert, Card } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function ContactEditPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactId = params?.id ? parseInt(String(params.id)) : null;
  const locale = (params?.locale as string) || 'fr';

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

  const handleUpdate = async (data: ContactCreate | ContactUpdate) => {
    if (!contactId) return;

    try {
      setSaving(true);
      setError(null);
      await reseauContactsAPI.update(contactId, data as ContactUpdate);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
      router.push(`/${locale}/dashboard/reseau/contacts/${contactId}`);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || 'Erreur lors de la modification du contact');
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (contactId) {
      router.push(`/${locale}/dashboard/reseau/contacts/${contactId}`);
    } else {
      router.push(`/${locale}/dashboard/reseau/contacts`);
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
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Module Réseau', href: `/${locale}/dashboard/reseau` },
            { label: 'Contacts', href: `/${locale}/dashboard/reseau/contacts` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">{error}</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
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
            { label: 'Dashboard', href: `/${locale}/dashboard` },
            { label: 'Module Réseau', href: `/${locale}/dashboard/reseau` },
            { label: 'Contacts', href: `/${locale}/dashboard/reseau/contacts` },
            { label: 'Modification' },
          ]}
        />
        <Alert variant="error">Le contact demandé n'existe pas.</Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux contacts
          </Button>
        </div>
      </PageContainer>
    );
  }

  // Mock data pour les entreprises et employés (à remplacer par des appels API réels si nécessaire)
  const companies: Array<{ id: number; name: string }> = [];
  const employees: Array<{ id: number; name: string }> = [];
  const circles = ['client', 'prospect', 'partenaire', 'fournisseur', 'autre'];

  return (
    <PageContainer>
      <PageHeader
        title={`Modifier ${contact.first_name} ${contact.last_name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: `/${locale}/dashboard` },
          { label: 'Module Réseau', href: `/${locale}/dashboard/reseau` },
          { label: 'Contacts', href: `/${locale}/dashboard/reseau/contacts` },
          {
            label: contact.first_name + ' ' + contact.last_name,
            href: `/${locale}/dashboard/reseau/contacts/${contact.id}`,
          },
          { label: 'Modification' },
        ]}
      />

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6">
        <Card>
          <div className="p-6">
            <ContactForm
              contact={contact}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              loading={saving}
              companies={companies}
              employees={employees}
              circles={circles}
            />
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}
