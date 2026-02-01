'use client';

import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import FormUploader from '@/components/forms/FormUploader';
import { Link } from '@/i18n/routing';
import { ArrowLeft, FileSearch } from 'lucide-react';

export default function FormImportPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/modules/formulaire/oaciq"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Importer un formulaire (OCR)</h1>
          <p className="text-muted-foreground mt-1">
            Déposez un formulaire OACIQ (PDF ou image). Le type de formulaire sera détecté et les
            champs extraits automatiquement pour révision.
          </p>
        </div>
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileSearch className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">Document à traiter</h2>
            </div>
            <FormUploader />
          </div>
        </Card>
      </div>
    </Container>
  );
}
