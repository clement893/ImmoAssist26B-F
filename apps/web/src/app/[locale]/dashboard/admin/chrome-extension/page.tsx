/**
 * Chrome Extension Admin Page
 * Gestion des tokens d'API pour l'extension ImmoAssist et instructions d'installation.
 */

'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { apiKeysAPI } from '@/lib/api';
import type { APIKeyListResponse, APIKeyResponse } from '@/lib/api';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Button, Card } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { Key, Copy, Trash2 } from 'lucide-react';

export default function ChromeExtensionAdminPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [apiKeys, setApiKeys] = useState<APIKeyListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<APIKeyResponse | null>(null);
  const [createName, setCreateName] = useState('Extension ImmoAssist');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    loadApiKeys();
  }, [isAuthenticated, router]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      const keys = await apiKeysAPI.list(true);
      setApiKeys(keys);
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors du chargement des clés API'));
      logger.error('Chrome extension: load API keys', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    try {
      setCreating(true);
      setError(null);
      const response = await apiKeysAPI.create({
        name: createName.trim() || 'Extension ImmoAssist',
        description: 'Clé pour l\'extension Chrome ImmoAssist (import Centris)',
        rotation_policy: 'manual',
      });
      setNewKey(response);
      await loadApiKeys();
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de créer la clé API'));
      logger.error('Chrome extension: create API key', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setCreating(false);
    }
  };

  const handleCopyKey = async () => {
    if (!newKey?.key) return;
    try {
      await navigator.clipboard.writeText(newKey.key);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copie dans le presse-papiers impossible');
    }
  };

  const handleRevoke = async (keyId: number) => {
    if (!confirm('Révoquer cette clé ? L\'extension ne pourra plus importer de propriétés avec cette clé.')) return;
    try {
      await apiKeysAPI.revoke(keyId);
      if (newKey?.id === keyId) setNewKey(null);
      await loadApiKeys();
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de révoquer la clé'));
    }
  };

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title="Extension Chrome ImmoAssist"
          description="Générez une clé API et suivez les étapes pour installer l'extension d'import depuis Centris."
        />

        {error && (
          <Alert variant="destructive" className="mb-6">
            {error}
          </Alert>
        )}

        {newKey && (
          <Alert variant="default" className="mb-6 border-green-500 bg-green-50 dark:bg-green-950/30">
            <div className="flex flex-col gap-2">
              <p className="font-medium">Clé créée — copiez-la maintenant (elle ne sera plus affichée).</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-sm">{newKey.key}</code>
                <Button size="sm" variant="outline" onClick={handleCopyKey}>
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copié' : 'Copier'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Collez cette clé dans la popup de l'extension (après installation) pour vous connecter à ImmoAssist.
              </p>
            </div>
          </Alert>
        )}

        <div className="space-y-8">
          <Section title="Clés API pour l'extension">
            <p className="mb-4 text-muted-foreground">
              L'extension Chrome utilise une clé API pour envoyer les propriétés importées (ex. Centris) vers votre
              compte ImmoAssist. Générez une clé dédiée et entrez-la dans la popup de l'extension.
            </p>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Nom de la clé"
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <Button onClick={handleCreateKey} disabled={creating}>
                <Key className="mr-2 h-4 w-4" />
                {creating ? 'Création…' : 'Générer une nouvelle clé'}
              </Button>
            </div>
            {loading ? (
              <Loading />
            ) : (
              <ul className="space-y-2">
                {apiKeys.length === 0 ? (
                  <li className="text-muted-foreground">Aucune clé API. Générez-en une ci-dessus.</li>
                ) : (
                  apiKeys.map((key) => (
                    <li
                      key={key.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-0.5">{key.key_prefix}••••••••</code>
                        <span>{key.name}</span>
                        {!key.is_active && (
                          <span className="rounded bg-destructive/20 px-2 py-0.5 text-destructive">Révoquée</span>
                        )}
                      </div>
                      {key.is_active && (
                        <Button size="sm" variant="ghost" onClick={() => handleRevoke(key.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </Section>

          <Section title="Installation de l'extension">
            <Card className="space-y-4 p-6">
              <ol className="list-decimal space-y-3 pl-5">
                <li>
                  <strong>Télécharger l'extension</strong> — Un fichier .zip sera fourni (ou cloner le dépôt et
                  empaqueter le dossier <code className="rounded bg-muted px-1">chrome-extension</code>).
                </li>
                <li>
                  Ouvrir <code className="rounded bg-muted px-1">chrome://extensions</code> dans Chrome.
                </li>
                <li>
                  Activer le <strong>Mode développeur</strong> (interrupteur en haut à droite).
                </li>
                <li>
                  Cliquer sur <strong>Charger l'extension non empaquetée</strong> et sélectionner le dossier
                  décompressé de l'extension.
                </li>
                <li>
                  Sur une page Centris (ex. une fiche propriété), cliquer sur l'icône ImmoAssist dans la barre
                  d'outils. Dans la popup, <strong>coller la clé API</strong> générée ci-dessus et enregistrer.
                </li>
              </ol>
              <p className="text-sm text-muted-foreground">
                Une fois configurée, l'extension extrait les données de la page et vous permet de les importer vers
                ImmoAssist en un clic, en les reliant à une transaction ou à un client.
              </p>
              <p className="text-sm text-muted-foreground">
                Saisissez <code className="rounded bg-muted px-1">chrome://extensions</code> dans la barre
                d'adresse de Chrome pour accéder à la page des extensions.
              </p>
            </Card>
          </Section>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
