'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/routing';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { oaciqFormsAPI } from '@/lib/api/oaciq-forms';
import { ArrowLeft, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';

export default function OACIQImportPdfPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f?.type === 'application/pdf') {
      setFile(f);
      setError(null);
    } else if (f) {
      setError('Veuillez sélectionner un fichier PDF.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f?.type === 'application/pdf') {
      setFile(f);
      setError(null);
    } else if (f) {
      setError('Veuillez sélectionner un fichier PDF.');
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async () => {
    if (!file || !code) return;
    setLoading(true);
    setError(null);
    try {
      const result = await oaciqFormsAPI.extractFromPdf(file, code);
      if (!result.success || !result.data) {
        setError('L’extraction n’a pas retourné de données.');
        setLoading(false);
        return;
      }
      const submission = await oaciqFormsAPI.createSubmission({ form_code: code });
      const cleanData = { ...result.data };
      delete (cleanData as Record<string, unknown>)['_raw_text'];
      await oaciqFormsAPI.saveSubmission(submission.id, {
        data: cleanData as Record<string, unknown>,
      });
      router.push(`/dashboard/forms/submissions/${submission.id}/review`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l’extraction ou de la sauvegarde.');
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Link
          href={`/dashboard/modules/formulaire/oaciq/${code}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au formulaire {code}
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Importer un PDF</h1>
          <p className="text-muted-foreground mt-1">
            Téléversez un formulaire {code} rempli (PDF). Les champs seront extraits et vous pourrez les vérifier avant enregistrement.
          </p>
        </div>

        {error && (
          <Alert variant="error" title="Erreur">
            {error}
          </Alert>
        )}

        <Card>
          <div className="p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${dragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' : 'border-border hover:border-primary-400 hover:bg-muted/50'}
              `}
            >
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-12 h-12 text-primary" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Changer de fichier
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Glissez un PDF ici ou cliquez pour parcourir</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fichier PDF uniquement (max 20 Mo)
                  </p>
                </>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              fullWidth
              className="mt-6"
              disabled={!file || loading}
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Extraction en cours…
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Extraire et réviser
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    </Container>
  );
}
