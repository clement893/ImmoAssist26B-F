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
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { oaciqFormsAPI, type OACIQForm } from '@/lib/api/oaciq-forms';

export default function OACIQFormsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<
    'obligatoire' | 'recommandé' | 'curateur_public' | undefined
  >();

  const { data: forms, isLoading } = useQuery({
    queryKey: ['oaciq-forms', category, search],
    queryFn: () => oaciqFormsAPI.list({ category, search }),
  });

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Formulaires OACIQ</h1>
          <p className="text-muted-foreground mt-1">
            49 formulaires officiels de l&apos;OACIQ
          </p>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
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
          <Tab value="all">Tous (49)</Tab>
          <Tab value="obligatoire">Obligatoires (28)</Tab>
          <Tab value="recommandé">Recommandés (15)</Tab>
          <Tab value="curateur_public">Curateur public (6)</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="all">
            <div className="mt-4">
              <FormsList forms={forms} isLoading={isLoading} router={router} />
            </div>
          </TabPanel>

          <TabPanel value="obligatoire">
            <div className="mt-4">
              <FormsList forms={forms} isLoading={isLoading} router={router} />
            </div>
          </TabPanel>

          <TabPanel value="recommandé">
            <div className="mt-4">
              <FormsList forms={forms} isLoading={isLoading} router={router} />
            </div>
          </TabPanel>

          <TabPanel value="curateur_public">
            <div className="mt-4">
              <FormsList forms={forms} isLoading={isLoading} router={router} />
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
  router,
}: {
  forms?: OACIQForm[];
  isLoading: boolean;
  router: any;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun formulaire trouvé
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map((form) => (
        <Card key={form.id} className="p-4 hover:shadow-lg transition">
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
