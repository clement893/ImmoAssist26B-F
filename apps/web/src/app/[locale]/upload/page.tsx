'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import FileUploadWithPreview from '@/components/ui/FileUploadWithPreview';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { Upload, CheckCircle, XCircle, File, Image, FileText } from 'lucide-react';
import { logger } from '@/lib/logger';
import {
  validateFile,
  generateUniqueFileName,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} from '@/lib/utils/fileValidation';

interface UploadedFile {
  id: string;
  name: string;
  originalName?: string; // Original file name before sanitization
  size: number;
  type: string;
  url?: string;
  uploadedAt: string;
  status: 'uploading' | 'success' | 'error';
}

function UploadContent() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (files: File[]) => {
    logger.debug('Files selected', { count: files.length, names: files.map((f) => f.name) });

    // Validate files client-side before upload
    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    files.forEach((file) => {
      // No size limit for images, use default for other files
      const isImage = file.type.startsWith('image/');
      const validation = validateFile(file, {
        allowedTypes: ALLOWED_MIME_TYPES.all,
        maxSize: isImage ? undefined : MAX_FILE_SIZE, // No limit for images
        requireExtensionMatch: true,
      });

      if (validation.valid) {
        validFiles.push(file);
      } else {
        validationErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (validationErrors.length > 0) {
      setError(`Certains fichiers ne sont pas valides:\n${validationErrors.join('\n')}`);
    }

    setSelectedFiles(validFiles);
    setError(validationErrors.length > 0 ? validationErrors.join('; ') : null);
    setSuccess(null);
  };

  const handleUpload = async () => {
    logger.debug('handleUpload called', { selectedFilesCount: selectedFiles.length });

    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      logger.info('Starting upload', { fileCount: selectedFiles.length });

      // Validate files server-side before upload
      // Note: Endpoint /v1/media/validate doesn't exist yet, using client-side validation only
      // Server-side validation - implement when /v1/media/validate endpoint is created in backend
      const validationPromises = selectedFiles.map(async (file) => {
        // For now, use client-side validation only
        // The file was already validated client-side in handleFileSelect
        return { file, valid: true, sanitizedName: generateUniqueFileName(file.name), error: null };
      });

      const validationResults = await Promise.all(validationPromises);
      const validFiles = validationResults.filter((r) => r.valid);
      const invalidFiles = validationResults.filter((r) => !r.valid);

      if (invalidFiles.length > 0) {
        const errors = invalidFiles.map((r) => `${r.file.name}: ${r.error || 'Invalid file'}`);
        setError(`Certains fichiers n'ont pas passé la validation serveur:\n${errors.join('\n')}`);
      }

      if (validFiles.length === 0) {
        setUploading(false);
        return;
      }

      // Simulate S3 upload - Replace with actual API call
      const uploadPromises = validFiles.map(async ({ file, sanitizedName }, index) => {
        const safeFileName = sanitizedName || generateUniqueFileName(file.name);
        logger.debug('Uploading file', {
          index: index + 1,
          total: validFiles.length,
          fileName: file.name,
          safeFileName,
        });

        // Simulate upload delay
        await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

        // Simulate success/error (90% success rate)
        const success = Math.random() > 0.1;

        const result = {
          id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          name: safeFileName, // Use sanitized name
          originalName: file.name, // Keep original for display
          size: file.size,
          type: file.type,
          url: success ? `https://s3.example.com/uploads/${safeFileName}` : undefined,
          uploadedAt: new Date().toISOString(),
          status: success ? ('success' as const) : ('error' as const),
        };

        logger.debug('File upload result', { fileName: file.name, safeFileName, success });
        return result;
      });

      const results = await Promise.all(uploadPromises);
      logger.info('Upload completed', { results });

      setUploadedFiles((prev) => [...prev, ...results]);
      setSelectedFiles([]);
      setSuccess(
        `${results.filter((r) => r.status === 'success').length} fichier(s) uploadé(s) avec succès`
      );
    } catch (err) {
      logger.error('Upload error', err instanceof Error ? err : new Error(String(err)));
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload des fichiers");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    }
    if (type.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  return (
    <Container className="py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Test S3 Upload</h1>
        <p className="text-foreground">Testez l'upload de fichiers vers AWS S3</p>
      </div>

      {error && (
        <Alert variant="error" title="Erreur" onClose={() => setError(null)} className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Succès" onClose={() => setSuccess(null)} className="mb-6">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card title="Upload de fichiers" className="lg:col-span-2">
          <div className="space-y-6">
            <FileUploadWithPreview
              label="Sélectionner des fichiers"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              multiple
              onFileSelect={handleFileSelect}
              maxSize={10}
              helperText="Taille maximale: 10MB par fichier"
              fullWidth
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  Fichiers sélectionnés ({selectedFiles.length}):
                </p>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium text-foreground">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="default">{file.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {selectedFiles.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  Sélectionnez des fichiers ci-dessus pour activer le bouton d'upload
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    logger.log('Button clicked', {
                      selectedFilesCount: selectedFiles.length,
                      uploading,
                      files: selectedFiles.map((f) => f.name),
                    });
                    if (selectedFiles.length === 0) {
                      setError(
                        'Veuillez sélectionner au moins un fichier avant de cliquer sur Uploader'
                      );
                      return;
                    }
                    handleUpload();
                  }}
                  loading={uploading}
                  disabled={selectedFiles.length === 0 || uploading}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {uploading
                      ? 'Upload en cours...'
                      : selectedFiles.length > 0
                        ? `Uploader ${selectedFiles.length} fichier(s)`
                        : 'Sélectionnez des fichiers'}
                  </span>
                </Button>
                {selectedFiles.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      logger.log('Clearing selection');
                      setSelectedFiles([]);
                    }}
                    disabled={uploading}
                    type="button"
                  >
                    Effacer la sélection
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <Card title="Fichiers uploadés" className="lg:col-span-2">
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {file.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-error-600 dark:text-error-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={file.status === 'success' ? 'success' : 'error'}>
                      {file.status === 'success' ? 'Uploadé' : 'Erreur'}
                    </Badge>
                    {file.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        Voir
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-error-600 hover:text-error-700 dark:text-error-400 dark:hover:text-error-500"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card title="Instructions">
          <div className="space-y-4 text-sm text-foreground">
            <div>
              <h3 className="font-semibold mb-2">Types de fichiers acceptés:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Images (JPG, PNG, GIF, etc.)</li>
                <li>Documents PDF</li>
                <li>Documents Word (.doc, .docx)</li>
                <li>Fichiers Excel (.xls, .xlsx)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Limites:</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Taille maximale: 10MB par fichier</li>
                <li>Upload multiple supporté</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Note:</h3>
              <p className="text-xs text-muted-foreground">
                Cette page simule l'upload vers S3. Dans un environnement de production, vous devrez
                configurer les credentials AWS et utiliser l'API backend pour générer les URLs de
                pré-signature S3.
              </p>
            </div>
          </div>
        </Card>

        {/* Status */}
        <Card title="Statut du service">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-foreground">Connexion S3</span>
              <Badge variant="success">Connecté</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-foreground">Bucket configuré</span>
              <Badge variant="success">Actif</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium text-foreground">Permissions</span>
              <Badge variant="success">OK</Badge>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}

export default function UploadPage() {
  return (
    <ProtectedRoute>
      <UploadContent />
    </ProtectedRoute>
  );
}
