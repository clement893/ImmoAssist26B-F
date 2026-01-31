'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Container, Card, Button, Input, Loading, Alert } from '@immoassist/ui';
import { oaciqFormsAPI, OACIQForm, OACIQFormCategory } from '@/lib/api/oaciq-adapters';
import { FileText, Download, Search } from 'lucide-react';

export default function OACIQPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  
  const [forms, setForms] = useState<OACIQForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OACIQFormCategory | undefined>();

  useEffect(() => {
    loadForms();
  }, [selectedCategory]);

  const loadForms = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await oaciqFormsAPI.list(selectedCategory);
      setForms(data);
    } catch (err) {
      console.error('Erreur lors du chargement des formulaires:', err);
      setError('Erreur lors du chargement des formulaires');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (pdfUrl: string | null) => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const filteredForms = forms.filter(form =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.code && form.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (form.category && form.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Formulaires OACIQ</h1>
          <p className="text-muted-foreground mt-1">
            Accédez et gérez les formulaires officiels de l&apos;Organisme d&apos;autorégulation du courtage immobilier du Québec
          </p>
        </div>

        {error && (
          <Alert variant="error">{error}</Alert>
        )}

        {/* Search and Filters */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un formulaire..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === undefined ? 'primary' : 'outline'}
                  onClick={() => setSelectedCategory(undefined)}
                >
                  Tous
                </Button>
                <Button
                  variant={selectedCategory === OACIQFormCategory.OBLIGATOIRE ? 'primary' : 'outline'}
                  onClick={() => setSelectedCategory(OACIQFormCategory.OBLIGATOIRE)}
                >
                  Obligatoires
                </Button>
                <Button
                  variant={selectedCategory === OACIQFormCategory.RECOMMANDE ? 'primary' : 'outline'}
                  onClick={() => setSelectedCategory(OACIQFormCategory.RECOMMANDE)}
                >
                  Recommandés
                </Button>
                <Button
                  variant={selectedCategory === OACIQFormCategory.CURATEUR_PUBLIC ? 'primary' : 'outline'}
                  onClick={() => setSelectedCategory(OACIQFormCategory.CURATEUR_PUBLIC)}
                >
                  Curateur Public
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Forms List */}
        {filteredForms.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Aucun formulaire trouvé' : 'Aucun formulaire disponible'}
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredForms.map((form) => (
              <Card key={form.id} hover>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {form.code && `[${form.code}] `}
                          {form.name}
                        </h3>
                        {form.category && (
                          <p className="text-sm text-muted-foreground capitalize">{form.category}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {form.code && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/${locale}/dashboard/modules/formulaire/oaciq/${form.code}/fill`)}
                        className="flex-1"
                      >
                        Remplir
                      </Button>
                    )}
                    {form.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(form.pdfUrl)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
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
