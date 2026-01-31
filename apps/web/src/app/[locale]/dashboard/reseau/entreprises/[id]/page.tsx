'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { companiesAPI, Company } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import { PageHeader, PageContainer } from '@/components/layout';
import CompanyDetail from '@/components/reseau/CompanyDetail';
import { Loading, Alert } from '@/components/ui';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_deleting, setDeleting] = useState(false);

  const companyId = params?.id ? parseInt(String(params.id)) : null;

  useEffect(() => {
    if (!companyId) {
      setError("ID d'entreprise invalide");
      setLoading(false);
      return;
    }

    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await companiesAPI.get(companyId);
      setCompany(data);
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError.message || "Erreur lors du chargement de l'entreprise");
      showToast({
        message: appError.message || "Erreur lors du chargement de l'entreprise",
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (company) {
      const locale = (params?.locale as string) || 'fr';
      router.push(`/${locale}/dashboard/reseau/entreprises/${company.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!company || !confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return;
    }

    try {
      setDeleting(true);
      await companiesAPI.delete(company.id);
      showToast({
        message: 'Entreprise supprimée avec succès',
        type: 'success',
      });
      const locale = (params?.locale as string) || 'fr';
      router.push(`/${locale}/dashboard/reseau/entreprises`);
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

  const handleBack = () => {
    const locale = (params?.locale as string) || 'fr';
    router.push(`/${locale}/dashboard/reseau/entreprises`);
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

  if (error && !company) {
    return (
      <PageContainer>
        <PageHeader
          title="Erreur"
          description={error}
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Module Réseau', href: '/dashboard/reseau' },
            { label: 'Entreprises', href: '/dashboard/reseau/entreprises' },
            { label: 'Détail' },
          ]}
          actions={
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Retour à la liste
            </Button>
          }
        />
        <Alert variant="error">{error}</Alert>
      </PageContainer>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <PageContainer>
      <PageHeader
        title={company.name}
        description={company.description || "Détails de l'entreprise"}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Entreprises', href: '/dashboard/reseau/entreprises' },
          { label: company.name },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Retour à la liste
          </Button>
        }
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      <CompanyDetail company={company} onEdit={handleEdit} onDelete={handleDelete} />
    </PageContainer>
  );
}
