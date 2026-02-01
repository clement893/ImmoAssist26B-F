'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { formOcrAPI } from '@/lib/api.ts';
import { extractApiData } from '@/lib/api/utils';
import { Upload, Loader2, AlertCircle } from 'lucide-react';

const ACCEPT = 'application/pdf,image/png,image/jpeg,image/webp';
const POLL_INTERVAL_MS = 2000;

export default function FormUploader() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      for (;;) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        try {
          const res = await formOcrAPI.getTaskStatus(taskId);
          const raw = extractApiData(res) ?? (res as { data?: unknown }).data ?? res;
          const data = raw as unknown as { status?: string; submission_id?: number; error?: string };
          const status = data.status;
          const submissionId = data.submission_id;
          const err = data.error;
          if (status === 'SUCCESS' && submissionId) {
            setProgress(null);
            setUploading(false);
            router.push(`/${locale}/dashboard/forms/submissions/${submissionId}/review`);
            return;
          }
          if (status === 'FAILURE') {
            setError(err || 'Traitement échoué');
            setProgress(null);
            setUploading(false);
            return;
          }
          setProgress('Traitement en cours…');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Erreur lors du suivi');
          setUploading(false);
          setProgress(null);
          return;
        }
      }
    },
    [locale, router]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress('Upload en cours…');
      try {
        const res = await formOcrAPI.uploadAndProcess(file);
        const data = extractApiData(res) ?? res;
        const taskId = (data as { task_id?: string }).task_id;
        if (!taskId) {
          setError('Réponse invalide du serveur');
          setUploading(false);
          setProgress(null);
          return;
        }
        setProgress('Extraction en cours…');
        await pollTaskStatus(taskId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erreur lors de l\'upload');
        setUploading(false);
        setProgress(null);
      }
    },
    [pollTaskStatus]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
        handleFile(file);
      } else {
        setError('Fichier non supporté. Utilisez un PDF ou une image (PNG, JPEG, WebP).');
      }
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      e.target.value = '';
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-colors
          ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${uploading ? 'pointer-events-none opacity-80' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept={ACCEPT}
          onChange={onInputChange}
          disabled={uploading}
          className="hidden"
          id="form-ocr-upload"
        />
        <label htmlFor="form-ocr-upload" className="cursor-pointer block">
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              <p className="text-gray-700 font-medium">{progress || 'Chargement…'}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="text-gray-700 font-medium">
                Glissez-déposez un formulaire (PDF ou image) ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-gray-500">PDF, PNG, JPEG, WebP — max 25 Mo</p>
            </div>
          )}
        </label>
      </div>
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
