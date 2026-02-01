'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import { formsAPI } from '@/lib/api.ts';
import { extractApiData } from '@/lib/api/utils';
import { ArrowLeft, Loader2, Check, ExternalLink } from 'lucide-react';

interface FormField {
  id?: string;
  type?: string;
  label?: string;
  name?: string;
  [key: string]: unknown;
}

interface Submission {
  id: number;
  form_id: number;
  form_name?: string;
  data: Record<string, unknown>;
  source_document_url?: string | null;
  extraction_confidence?: Record<string, number> | null;
  needs_review?: boolean;
}

const CONFIDENCE_THRESHOLD = 0.8;

export default function SubmissionReviewPage() {
  const params = useParams();
  const submissionId = params.id as string;
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const subRes = await formsAPI.getSubmission(parseInt(submissionId, 10));
        const sub = extractApiData(subRes) ?? subRes;
        if (!cancelled && sub && typeof sub === 'object' && 'id' in sub) {
          const s = sub as unknown as Submission;
          setSubmission(s);
          setEditedData(s.data || {});
          const formId = s.form_id;
          const fRes = await formsAPI.get(formId);
          const form = extractApiData(fRes) ?? fRes;
          const fields = (form as { fields?: FormField[] }).fields ?? [];
          setFormFields(Array.isArray(fields) ? fields : []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur chargement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const handleSave = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      await formsAPI.updateSubmission(submission.id, { data: editedData });
      setSubmission((prev) => (prev ? { ...prev, data: editedData } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!submission) return;
    setSaving(true);
    try {
      await formsAPI.updateSubmission(submission.id, { data: editedData, needs_review: false });
      setSubmission((prev) => (prev ? { ...prev, data: editedData, needs_review: false } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur approbation');
    } finally {
      setSaving(false);
    }
  };

  const confidence = submission?.extraction_confidence ?? {};
  const needsReviewHighlight = (name: string) => {
    const c = confidence[name];
    return c != null && c < CONFIDENCE_THRESHOLD;
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Container>
    );
  }

  if (error && !submission) {
    return (
      <Container>
        <Alert variant="error" title="Erreur">
          {error}
        </Alert>
        <Link href="/dashboard/modules/formulaire/oaciq" className="mt-4 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="w-4 h-4" />
          Retour aux formulaires OACIQ
        </Link>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container>
        <Alert variant="error" title="Soumission introuvable">Soumission introuvable.</Alert>
        <Link href="/dashboard/modules/formulaire/oaciq" className="mt-4 inline-flex items-center gap-2 text-primary">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/forms/import"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={saving || !submission.needs_review}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              <Check className="w-4 h-4 inline mr-2" />
              Approuver
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-bold">
          Révision : {submission.form_name ?? `Soumission #${submission.id}`}
        </h1>

        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document original */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Document original</h2>
            </div>
            <div className="p-4 min-h-[400px]">
              {submission.source_document_url ? (
                <div className="space-y-2">
                  <iframe
                    src={submission.source_document_url}
                    title="Document original"
                    className="w-full h-[500px] border border-border rounded-lg bg-muted"
                  />
                  <a
                    href={submission.source_document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir dans un nouvel onglet
                  </a>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Aucun document associé.</p>
              )}
            </div>
          </Card>

          {/* Formulaire pré-rempli */}
          <Card>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold">Champs extraits (à vérifier)</h2>
              {submission.needs_review && (
                <p className="text-sm text-amber-600 mt-1">Révision recommandée</p>
              )}
            </div>
            <div className="p-4 space-y-4">
              {formFields.length === 0 ? (
                <div className="space-y-2">
                  {Object.entries(editedData).map(([name, value]) => (
                    <div
                      key={name}
                      className={`rounded-lg border p-3 ${needsReviewHighlight(name) ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'border-border'}`}
                    >
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        {name}
                        {needsReviewHighlight(name) && (
                          <span className="ml-2 text-amber-600 text-xs">(à vérifier)</span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={value != null ? String(value) : ''}
                        onChange={(e) =>
                          setEditedData((prev) => ({ ...prev, [name]: e.target.value }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                formFields.map((field) => {
                  const name = (field.name ?? field.id ?? '') as string;
                  const value = editedData[name];
                  const lowConfidence = needsReviewHighlight(name);
                  return (
                    <div
                      key={name}
                      className={`rounded-lg border p-3 ${lowConfidence ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' : 'border-border'}`}
                    >
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        {field.label ?? name}
                        {lowConfidence && (
                          <span className="ml-2 text-amber-600 text-xs">(à vérifier)</span>
                        )}
                      </label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={value != null ? String(value) : ''}
                        onChange={(e) =>
                          setEditedData((prev) => ({
                            ...prev,
                            [name]: field.type === 'number' ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-border rounded-md bg-background"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
