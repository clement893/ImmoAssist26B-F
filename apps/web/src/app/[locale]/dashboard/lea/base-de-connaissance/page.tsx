'use client';

import { useState, useEffect, useCallback } from 'react';
import { leaAPI } from '@/lib/api';
import { Container, Card, Button } from '@immoassist/ui';
import { MessageSquare, Upload, FileText, Trash2, Loader2, Save, BookOpen } from 'lucide-react';
import { useToast } from '@/lib/toast';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';

interface LeaKnowledgeDoc {
  id: string;
  filename: string;
  original_filename: string;
  size: number;
  content_type: string;
  created_at: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];
const MAX_SIZE_MB = 20;

export default function BaseConnaissanceLeaPage() {
  const [oaciqContent, setOaciqContent] = useState('');
  const [loadingContent, setLoadingContent] = useState(true);
  const [savingContent, setSavingContent] = useState(false);
  const [documents, setDocuments] = useState<LeaKnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  const loadOaciqContent = useCallback(async () => {
    setLoadingContent(true);
    setError(null);
    try {
      const res = await leaAPI.getKnowledgeContent('oaciq');
      const content = (res.data as { content?: string })?.content ?? '';
      setOaciqContent(typeof content === 'string' ? content : '');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err.response?.data?.detail || err.message || 'Impossible de charger le contenu OACIQ.');
    } finally {
      setLoadingContent(false);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leaAPI.listKnowledgeDocuments();
      setDocuments(Array.isArray(res.data) ? res.data : []);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      setError(err.response?.data?.detail || err.message || 'Impossible de charger les documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOaciqContent();
  }, [loadOaciqContent]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleSaveOaciq = async () => {
    setSavingContent(true);
    setError(null);
    try {
      await leaAPI.updateKnowledgeContent(oaciqContent, 'oaciq');
      toastSuccess?.('Contenu OACIQ enregistré. Léa utilisera cette base de connaissance.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      toastError?.(err.response?.data?.detail || err.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSavingContent(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toastError?.(`Fichier trop volumineux (max ${MAX_SIZE_MB} Mo).`);
      return;
    }
    const ct = (file.type || '').toLowerCase();
    if (ct && !ALLOWED_TYPES.includes(ct)) {
      toastError?.('Type de fichier non autorisé. Utilisez PDF, TXT, MD, DOC ou DOCX.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await leaAPI.uploadKnowledgeDocument(file);
      toastSuccess?.('Document ajouté à la base de connaissance. Léa pourra l\'utiliser (TXT/MD : texte extrait).');
      await loadDocuments();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      toastError?.(err.response?.data?.detail || err.message || 'Erreur lors de l\'ajout du document.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await leaAPI.deleteKnowledgeDocument(id);
      toastSuccess?.('Document supprimé.');
      await loadDocuments();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      toastError?.(err.response?.data?.detail || err.message || 'Erreur lors de la suppression.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fr-CA', { dateStyle: 'short' });
    } catch {
      return iso;
    }
  };

  return (
    <ProtectedSuperAdminRoute>
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-primary-500" />
          Base de connaissance Léa
        </h1>
        <p className="text-muted-foreground">
          Gérez ici tout ce que Léa utilise pour répondre : le contenu sur les formulaires OACIQ (éditable ci‑dessous)
          et les documents que vous ajoutez. Ces éléments sont injectés dans le contexte de Léa à chaque conversation.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Contenu OACIQ (formulaires) – éditable */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-500" />
          Base de connaissance OACIQ (formulaires)
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Texte en Markdown décrivant les formulaires OACIQ (PA, DIA, CP, CCVE, etc.), quand les utiliser et les bonnes pratiques.
          Léa s&apos;appuie sur ce contenu pour accompagner les utilisateurs sur les formulaires.
        </p>
        {loadingContent ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement du contenu…</span>
          </div>
        ) : (
          <>
            <textarea
              className="w-full min-h-[320px] rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              value={oaciqContent}
              onChange={(e) => setOaciqContent(e.target.value)}
              placeholder="# Base de connaissance OACIQ pour Léa&#10;&#10;Décrivez ici les formulaires (PA, DIA, CP, etc.)..."
              spellCheck={false}
            />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleSaveOaciq}
                disabled={savingContent}
                className="gap-2"
              >
                {savingContent ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Enregistrer le contenu OACIQ
              </Button>
            </div>
          </>
        )}
      </Card>

      {/* Documents (upload + liste) */}
      <Card className="p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">Ajouter un document</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Types acceptés : PDF, TXT, Markdown, DOC, DOCX. Taille max : {MAX_SIZE_MB} Mo.
          Les fichiers TXT et MD sont extraits et intégrés au contexte de Léa.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span>{uploading ? 'Envoi en cours…' : 'Choisir un fichier'}</span>
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.txt,.md,.doc,.docx,application/pdf,text/plain,text/markdown,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={handleFileSelect}
            disabled={uploading}
          />
        </label>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Documents dans la base de connaissance</h2>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Chargement…</span>
          </div>
        ) : documents.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            Aucun document pour l&apos;instant. Ajoutez-en un ci-dessus.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate" title={doc.original_filename || doc.filename}>
                      {doc.original_filename || doc.filename}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatSize(doc.size)} · {formatDate(doc.created_at)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Supprimer"
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Container>
    </ProtectedSuperAdminRoute>
  );
}
