'use client';

import { useState, useRef } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import { useToast } from '@/components/ui';
import { X, Image as ImageIcon, FileText } from 'lucide-react';
// Simple validation functions
const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  // No size limit for images (removed 5MB restriction)
  return allowedTypes.includes(file.type) && file.size > 0;
};

const validateDocumentFile = (file: File): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const maxSize = 10 * 1024 * 1024; // 10MB
  return allowedTypes.includes(file.type) && file.size <= maxSize;
};

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export default function ExampleFileUploadPage() {
  const { showToast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null, type: 'image' | 'document') => {
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file
      const isValid = type === 'image' ? validateImageFile(file) : validateDocumentFile(file);

      if (!isValid) {
        showToast({
          message: `Fichier invalide: ${file.name}`,
          type: 'error',
        });
        return;
      }

      const fileId = `${Date.now()}-${Math.random()}`;
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'uploading',
      };

      // Generate preview for images
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles((prev) =>
            prev.map((f) => (f.id === fileId ? { ...f, preview: e.target?.result as string } : f))
          );
        };
        reader.readAsDataURL(file);
      }

      setUploadedFiles((prev) => [...prev, uploadedFile]);

      // Simulate upload progress
      simulateUpload(fileId);
    });
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, progress: Math.min(progress, 100) } : f))
      );

      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: 'success' as const } : f))
        );
        showToast({
          message: 'Fichier uploadé avec succès',
          type: 'success',
        });
      }
    }, 200);
  };

  const handleRemove = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-5 h-5" />;
    }
    return <FileText className="w-5 h-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple Upload de Fichiers</h1>
        <p className="text-muted-foreground">
          Upload de fichiers avec preview, barre de progression et validation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Upload */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Upload d'Images</h2>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Cliquez pour uploader une image</p>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, GIF (aucune limite de taille)
                </p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, 'image')}
                />
              </div>

              {/* Uploaded Images */}
              <div className="space-y-2">
                {uploadedFiles
                  .filter((f) => f.file.type.startsWith('image/'))
                  .map((uploadedFile) => (
                    <div key={uploadedFile.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        {uploadedFile.preview && (
                          <img
                            src={uploadedFile.preview}
                            alt={uploadedFile.file.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                          {uploadedFile.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${uploadedFile.progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {uploadedFile.progress}%
                              </p>
                            </div>
                          )}
                          {uploadedFile.status === 'success' && (
                            <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                              ✓ Uploadé
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(uploadedFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Document Upload */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Upload de Documents</h2>
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">Cliquez pour uploader un document</p>
                <p className="text-sm text-muted-foreground">PDF, DOC, XLS jusqu'à 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files, 'document')}
                />
              </div>

              {/* Uploaded Documents */}
              <div className="space-y-2">
                {uploadedFiles
                  .filter((f) => !f.file.type.startsWith('image/'))
                  .map((uploadedFile) => (
                    <div key={uploadedFile.id} className="border border-border rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded flex items-center justify-center">
                          {getFileIcon(uploadedFile.file)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {uploadedFile.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadedFile.file.size)}
                          </p>
                          {uploadedFile.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary-600 h-2 rounded-full transition-all"
                                  style={{ width: `${uploadedFile.progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {uploadedFile.progress}%
                              </p>
                            </div>
                          )}
                          {uploadedFile.status === 'success' && (
                            <p className="text-xs text-success-600 dark:text-success-400 mt-1">
                              ✓ Uploadé
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(uploadedFile.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Code Example */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Points clés de cet exemple :
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ Preview d'images avant upload</li>
            <li>✅ Barre de progression</li>
            <li>✅ Validation taille/type de fichiers</li>
            <li>✅ Gestion d'erreurs</li>
            <li>✅ Support multi-fichiers</li>
            <li>✅ Affichage taille fichiers</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
