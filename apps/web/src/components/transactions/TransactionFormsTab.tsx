'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Eye,
  Search,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { oaciqFormsAPI, type OACIQForm } from '@/lib/api/oaciq-forms';
import { useToast } from '@/lib/toast';

interface TransactionFormsTabProps {
  transactionId: number;
}

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

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'obligatoire':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'recommandé':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'curateur_public':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export default function TransactionFormsTab({ transactionId }: TransactionFormsTabProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Load all OACIQ forms
  const { data: allForms, isLoading: formsLoading } = useQuery({
    queryKey: ['oaciq-forms', 'all'],
    queryFn: () => oaciqFormsAPI.list(),
  });

  // Load submissions for this transaction
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['oaciq-submissions', transactionId],
    queryFn: () => oaciqFormsAPI.listTransactionSubmissions(transactionId),
  });

  // Create new submission mutation
  const createSubmissionMutation = useMutation({
    mutationFn: (formCode: string) =>
      oaciqFormsAPI.createTransactionSubmission(transactionId, formCode),
    onSuccess: (submission) => {
      queryClient.invalidateQueries({ queryKey: ['oaciq-submissions', transactionId] });
      showToast({
        message: 'Formulaire créé avec succès',
        type: 'success',
      });
      // Navigate to fill page
      router.push(`/dashboard/modules/formulaire/oaciq/${submission.form_code}/fill?submissionId=${submission.id}`);
    },
    onError: (error: Error) => {
      showToast({
        message: error.message || 'Erreur lors de la création du formulaire',
        type: 'error',
      });
    },
  });

  // Filter forms
  const filteredForms = (allForms || []).filter((form) => {
    const matchesSearch =
      !searchQuery ||
      form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      form.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || form.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get forms that already have submissions
  const formsWithSubmissions = new Set(
    (submissions || []).map((s) => s.form_code || s.form_id.toString())
  );

  // Group forms by category
  const formsByCategory = filteredForms.reduce(
    (acc, form) => {
      const category = form.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(form);
      return acc;
    },
    {} as Record<string, OACIQForm[]>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  if (formsLoading || submissionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un formulaire..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Toutes les catégories</option>
          <option value="obligatoire">Obligatoire</option>
          <option value="recommandé">Recommandé</option>
          <option value="curateur_public">Curateur public</option>
        </select>
      </div>

      {/* Existing Submissions */}
      {submissions && submissions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Formulaires associés</h3>
          <div className="grid gap-4">
            {submissions.map((submission) => {
              const form = allForms?.find(
                (f) => f.code === submission.form_code || f.id === submission.form_id
              );
              return (
                <Card key={submission.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {form?.name || `Formulaire #${submission.form_id}`}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Code: {submission.form_code || form?.code || '-'} • Créé le{' '}
                          {formatDate(submission.submitted_at)}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          submission.status
                        )}`}
                      >
                        {getStatusLabel(submission.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(
                            `/dashboard/modules/formulaire/oaciq/${submission.form_code || form?.code}/fill?submissionId=${submission.id}`
                          );
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Forms */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Formulaires OACIQ disponibles
        </h3>

        {Object.keys(formsByCategory).length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Aucun formulaire trouvé</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(formsByCategory).map(([category, forms]) => (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-700 mb-3 uppercase">
                  {category === 'obligatoire'
                    ? 'Obligatoires'
                    : category === 'recommandé'
                      ? 'Recommandés'
                      : category === 'curateur_public'
                        ? 'Curateur public'
                        : category}
                </h4>
                <div className="grid gap-4">
                  {forms.map((form) => {
                    const hasSubmission = formsWithSubmissions.has(form.code);
                    const submission = submissions?.find(
                      (s) => s.form_code === form.code || s.form_id === form.id
                    );

                    return (
                      <Card key={form.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{form.name}</h4>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(
                                    form.category
                                  )}`}
                                >
                                  {form.category}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500">Code: {form.code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasSubmission && submission ? (
                              <>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                    submission.status
                                  )}`}
                                >
                                  {getStatusLabel(submission.status)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    router.push(
                                      `/dashboard/modules/formulaire/oaciq/${form.code}/fill?submissionId=${submission.id}`
                                    );
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Voir
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => createSubmissionMutation.mutate(form.code)}
                                disabled={createSubmissionMutation.isPending}
                              >
                                {createSubmissionMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                ) : (
                                  <Plus className="w-4 h-4 mr-1" />
                                )}
                                Créer
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
