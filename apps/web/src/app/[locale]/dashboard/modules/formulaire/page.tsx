'use client';

import { useRouter, useParams } from 'next/navigation';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { FileText, ClipboardList, FileCheck } from 'lucide-react';

export default function FormulaireModulePage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Module Formulaires</h1>
          <p className="text-muted-foreground mt-1">
            Gestion et création de formulaires pour vos transactions immobilières
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* OACIQ Card */}
          <Card hover onClick={() => router.push(`/${locale}/dashboard/modules/formulaire/oaciq`)}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Formulaires OACIQ</h2>
                  <p className="text-sm text-muted-foreground">
                    Formulaires officiels de l&apos;OACIQ
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Accédez aux formulaires officiels de l&apos;Organisme d&apos;autorégulation du courtage immobilier du Québec. Téléchargez, complétez et téléversez vos formulaires.
              </p>
              <Button variant="default" className="w-full">
                Accéder aux formulaires OACIQ
              </Button>
            </div>
          </Card>

          {/* Mes Clauses Card */}
          <Card hover onClick={() => router.push(`/${locale}/dashboard/modules/formulaire/mes-clauses`)}>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-success/10 rounded-lg">
                  <ClipboardList className="w-8 h-8 text-success" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Mes Clauses</h2>
                  <p className="text-sm text-muted-foreground">
                    Bibliothèque de clauses réutilisables
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                Gérez votre bibliothèque personnelle de clauses réutilisables. Créez, modifiez et réutilisez vos clauses favorites pour vos transactions.
              </p>
              <Button variant="default" className="w-full">
                Gérer mes clauses
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Accès rapide</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/${locale}/dashboard/modules/formulaire/oaciq`)}>
                <FileCheck className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium">Formulaires OACIQ</div>
                  <div className="text-sm text-muted-foreground">Formulaires officiels</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/${locale}/dashboard/modules/formulaire/mes-clauses`)}>
                <ClipboardList className="w-5 h-5 text-success" />
                <div>
                  <div className="font-medium">Mes Clauses</div>
                  <div className="text-sm text-muted-foreground">Clauses personnalisées</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}
