'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import Input from '@/components/ui/Input';
import {
  FileText,
  ArrowLeft,
  Search,
  Eye,
  Edit,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { oaciqFormsAPI, type OACIQFormSubmission } from '@/lib/api/oaciq-forms';

export default function MesFormulairesOACIQPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formCodeFilter, setFormCodeFilter] = useState<string>('all');

  // Load all OACIQ form submissions for the current user
  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['oaciq-my-submissions', statusFilter, formCodeFilter],
    queryFn: () =>
      oaciqFormsAPI.listMySubmissions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        form_code: formCodeFilter !== 'all' ? formCodeFilter : undefined,
      }),
  });

  // Load all forms to populate the form code filter
  const { data: allForms } = useQuery({
    queryKey: ['oaciq-forms', 'all'],
    queryFn: () => oaciqFormsAPI.list(),
  });

  const filteredSubmissions = (submissions || []).filter((submission) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      submission.form_code?.toLowerCase().includes(query) ||
      (submission.data && JSON.stringify(submission.data).toLowerCase().includes(query))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'signed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'signed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'draft':
        return <Clock className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'signed':
        return 'Signé';
      case 'draft':
        return 'Brouillon';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // Group submissions by transaction
  const submissionsByTransaction = filteredSubmissions.reduce(
    (acc, submission) => {
      const key = submission.transaction_id || 'no-transaction';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(submission);
      return acc;
    },
    {} as Record<string | number, OACIQFormSubmission[]>
  );

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/dashboard/modules/formulaire"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au module
            </Link>
            <h1 className="text-3xl font-bold">Mes formulaires OACIQ</h1>
            <p className="text-muted-foreground mt-1">
              Consultez et gérez tous vos formulaires OACIQ et leurs soumissions
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Erreur">
            {error instanceof Error ? error.message : 'Impossible de charger les formulaires.'}
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un formulaire..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="completed">Complété</option>
                <option value="signed">Signé</option>
              </select>
              <select
                value={formCodeFilter}
                onChange={(e) => setFormCodeFilter(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
              >
                <option value="all">Tous les formulaires</option>
                {allForms?.map((form) => (
                  <option key={form.code} value={form.code}>
                    {form.code} - {form.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <Card>
            <div className="p-12 flex justify-center">
              <Loading />
            </div>
          </Card>
        ) : filteredSubmissions.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-2">
                {searchQuery || statusFilter !== 'all' || formCodeFilter !== 'all'
                  ? 'Aucun formulaire ne correspond aux filtres.'
                  : 'Aucun formulaire OACIQ créé.'}
              </p>
              {!searchQuery && statusFilter === 'all' && formCodeFilter === 'all' && (
                <p className="text-sm text-muted-foreground">
                  Les formulaires OACIQ que vous créez ou importez apparaîtront ici.
                </p>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(submissionsByTransaction).map(([transactionId, transactionSubmissions]) => (
              <Card key={transactionId}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                      {transactionId === 'no-transaction' ? (
                        'Sans transaction'
                      ) : (
                        <>
                          Transaction #{transactionId}
                          <Link
                            href={`/dashboard/transactions/${transactionId}`}
                            className="ml-2 text-sm text-primary hover:underline"
                          >
                            Voir la transaction
                          </Link>
                        </>
                      )}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                      {transactionSubmissions.length} formulaire{transactionSubmissions.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {transactionSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900">
                                {submission.form_code || `Formulaire #${submission.form_id}`}
                              </h3>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(
                                  submission.status
                                )}`}
                              >
                                {getStatusIcon(submission.status)}
                                {getStatusLabel(submission.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Dernière modification: {formatDate(submission.submitted_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link
                              href={`/dashboard/modules/formulaire/oaciq/${submission.form_code}/fill?submissionId=${submission.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Link>
                          </Button>
                          {submission.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link
                                href={`/dashboard/modules/formulaire/oaciq/${submission.form_code}/fill?submissionId=${submission.id}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Modifier
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
