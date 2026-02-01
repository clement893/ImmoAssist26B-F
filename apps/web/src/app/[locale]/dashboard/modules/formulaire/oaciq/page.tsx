/**
 * OACIQ Forms Page
 * Liste des formulaires OACIQ disponibles
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Input } from '@/components/ui';
import Tabs, { TabList, Tab, TabPanels, TabPanel } from '@/components/ui/Tabs';
import { FileText, Download, CheckCircle2, Upload, ExternalLink } from 'lucide-react';
import Link from '@/i18n/routing';
import { useQuery } from '@tanstack/react-query';
import { oaciqFormsAPI, type OACIQForm } from '@/lib/api/oaciq-forms';

export default function OACIQFormsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<
    'obligatoire' | 'recommandé' | 'curateur_public' | undefined
  >();

  // Load all forms for counting (without filters)
  const { data: allForms } = useQuery({
    queryKey: ['oaciq-forms', 'all'],
    queryFn: () => oaciqFormsAPI.list(),
    retry: 1,
  });

  // Load filtered forms for display
  const { data: forms, isLoading, error } = useQuery({
    queryKey: ['oaciq-forms', category, search],
    queryFn: async () => {
      const result = await oaciqFormsAPI.list({ category, search });
      console.log('[OACIQ Forms] API response:', {
        result,
        isArray: Array.isArray(result),
        length: Array.isArray(result) ? result.length : 'N/A',
        category,
        search,
      });
      return result;
    },
    retry: 1,
  });

  return (
    <div className="container py-10"> {/* Revamp UI - Padding vertical augmenté */}
      <div className="flex items-center justify-between mb-8"> {/* Revamp UI - Margin augmentée */}
        <div>
          <h1 className="text-4xl font-bold">Formulaires OACIQ</h1> {/* Revamp UI - Taille titre augmentée */}
          <p className="text-muted-foreground mt-2 text-base"> {/* Revamp UI - Margin et taille texte augmentées */}
            {allForms ? `${allForms.length} formulaire${allForms.length > 1 ? 's' : ''} officiel${allForms.length > 1 ? 's' : ''} de l'OACIQ` : 'Formulaires officiels de l\'OACIQ'}
          </p>
        </div>
        <Link href="/dashboard/modules/formulaire/oaciq/import">
          <Button variant="white" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Guide d'import API
            <ExternalLink className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Barre de recherche */}
      <div className="mb-8"> {/* Revamp UI - Margin augmentée */}
        <Input
          placeholder="Rechercher un formulaire par code ou nom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Onglets par catégorie */}
      <Tabs
        defaultTab="all"
        onChange={(v) => {
          if (v === 'all') setCategory(undefined);
          else setCategory(v as any);
        }}
      >
        <TabList>
          <Tab value="all">Tous {allForms ? `(${allForms.length})` : ''}</Tab>
          <Tab value="obligatoire">Obligatoires {allForms ? `(${allForms.filter(f => f.category === 'obligatoire').length})` : ''}</Tab>
          <Tab value="recommandé">Recommandés {allForms ? `(${allForms.filter(f => f.category === 'recommandé').length})` : ''}</Tab>
          <Tab value="curateur_public">Curateur public {allForms ? `(${allForms.filter(f => f.category === 'curateur_public').length})` : ''}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="all">
            <div className="mt-6"> {/* Revamp UI - Margin augmentée */}
              <FormsList forms={forms} isLoading={isLoading} error={error} router={router} />
            </div>
          </TabPanel>

          <TabPanel value="obligatoire">
            <div className="mt-6"> {/* Revamp UI - Margin augmentée */}
              <FormsList forms={forms} isLoading={isLoading} error={error} router={router} />
            </div>
          </TabPanel>

          <TabPanel value="recommandé">
            <div className="mt-6"> {/* Revamp UI - Margin augmentée */}
              <FormsList forms={forms} isLoading={isLoading} error={error} router={router} />
            </div>
          </TabPanel>

          <TabPanel value="curateur_public">
            <div className="mt-4">
              <FormsList forms={forms} isLoading={isLoading} error={error} router={router} />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}

function FormsList({
  forms,
  isLoading,
  error,
  router,
}: {
  forms?: OACIQForm[];
  isLoading: boolean;
  error?: Error | null;
  router: any;
}) {
  // Debug logging
  console.log('[FormsList] Render:', {
    forms,
    formsLength: forms?.length,
    isLoading,
    error: error?.message,
    isArray: Array.isArray(forms),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (error) {
    console.error('[FormsList] Error loading OACIQ forms:', error);
    return (
      <div className="text-center py-12">
        <div className="text-error-600 dark:text-error-400 mb-2">
          Erreur lors du chargement des formulaires
        </div>
        <div className="text-sm text-muted-foreground">
          {error.message || 'Une erreur est survenue'}
        </div>
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    console.warn('[FormsList] No forms found:', { forms, formsLength: forms?.length });
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun formulaire trouvé
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map((form) => (
        <Card key={form.id} className="p-4 hover:shadow-standard-lg transition-modern"> // UI Revamp - Nouveau système d'ombres et transition moderne
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="h-5 w-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                  {form.code}
                </span>
                {form.fields && Object.keys(form.fields).length > 0 && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Validé
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                {form.name}
              </h3>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => router.push(`/dashboard/modules/formulaire/oaciq/${form.code}/fill`)}
                >
                  Remplir
                </Button>

                {form.pdf_url && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={form.pdf_url} target="_blank" rel="noopener">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
