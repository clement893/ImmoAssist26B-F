'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';
import { formsAPI } from '@/lib/api';
import { extractApiData } from '@/lib/api/utils';
import { FileText, ArrowLeft, ExternalLink, Search } from 'lucide-react';

interface FormItem {
  id: number;
  name: string;
  description?: string | null;
  fields?: unknown[];
  submit_button_text?: string;
  success_message?: string | null;
  user_id?: number | null;
  created_at: string;
  updated_at: string;
}

export default function MesFormulairesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const [forms, setForms] = useState<FormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await formsAPI.list();
        const data = extractApiData<FormItem[] | { items: FormItem[] }>(res as unknown);
        const list = Array.isArray(data)
          ? data
          : data && typeof data === 'object' && 'items' in data
            ? data.items
            : [];
        if (!cancelled) setForms(list);
      } catch (e) {
        if (!cancelled) setError('Impossible de charger les formulaires.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredForms = forms.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

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
            <h1 className="text-3xl font-bold">Mes formulaires</h1>
            <p className="text-muted-foreground mt-1">
              Consultez et gérez vos formulaires dynamiques et leurs réponses
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        {loading ? (
          <Card>
            <div className="p-12 flex justify-center">
              <Loading />
            </div>
          </Card>
        ) : (
          <>
            {/* Search */}
            {forms.length > 0 && (
              <Card>
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Rechercher un formulaire..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* List */}
            {filteredForms.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">
                    {searchQuery ? 'Aucun formulaire ne correspond à la recherche.' : 'Aucun formulaire créé.'}
                  </p>
                  {!searchQuery && (
                    <p className="text-sm text-muted-foreground">
                      Les formulaires que vous créez apparaîtront ici. Vous pouvez aussi utiliser les formulaires OACIQ depuis la vue d&apos;ensemble.
                    </p>
                  )}
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredForms.map((form) => (
                  <Card key={form.id} hover className="flex flex-col">
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                          <FileText className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg truncate">{form.name}</h3>
                          {form.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {form.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          Créé le {formatDate(form.created_at)}
                        </span>
                        <Button
                          variant="primary"
                          size="sm"
                          asChild
                        >
                          <Link href={`/forms/${form.id}/submissions`}>
                            Voir les réponses
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
