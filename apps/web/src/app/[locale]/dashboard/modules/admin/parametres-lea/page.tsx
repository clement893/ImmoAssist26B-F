'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Container, Card, Button } from '@immoassist/ui';
import Input from '@/components/ui/Input';
import Tabs from '@/components/ui/Tabs';
import { MessageSquare, Save, RotateCcw, Loader2, Zap, CheckCircle2, XCircle } from 'lucide-react';

export interface LeaCapability {
  id: string;
  label: string;
  description: string;
}

interface CapabilityCheckResult {
  ok: boolean;
  message?: string;
}

export interface LeaSettingsData {
  system_prompt: string;
  max_tokens: number;
  tts_model: string;
  tts_voice: string;
}

const DEFAULT_SYSTEM_PROMPT = `Tu es Léa, une assistante immobilière experte au Québec.
Tu aides les courtiers et les particuliers : transactions, formulaires OACIQ, vente, achat.

Règles importantes:
- Réponds en français, de façon courtoise et professionnelle.
- Garde tes réponses **courtes** (2 à 4 phrases max), sauf si l'utilisateur demande explicitement plus de détails.
- Pour faire avancer la conversation, **pose une question pertinente** ou propose la prochaine étape quand c'est naturel.
- Sois directe et efficace : pas de formules de politesse longues, va à l'essentiel.`;

const DEFAULT_SETTINGS: LeaSettingsData = {
  system_prompt: DEFAULT_SYSTEM_PROMPT,
  max_tokens: 256,
  tts_model: 'tts-1-hd',
  tts_voice: 'shimmer',
};

const TTS_VOICES = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova (féminine)' },
  { value: 'shimmer', label: 'Shimmer (douce, chaleureuse – défaut)' },
];

const TTS_MODELS = [
  { value: 'tts-1', label: 'tts-1 (rapide)' },
  { value: 'tts-1-hd', label: 'tts-1-hd (meilleure qualité)' },
];

export default function ParametresLeaPage() {
  const [settings, setSettings] = useState<LeaSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [capabilities, setCapabilities] = useState<LeaCapability[]>([]);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [checkResults, setCheckResults] = useState<Record<string, CapabilityCheckResult>>({});
  const [checkLoading, setCheckLoading] = useState<Record<string, boolean>>({});

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<LeaSettingsData>('/v1/lea/settings');
      if (res.data && typeof res.data === 'object') {
        const d = res.data as LeaSettingsData;
        setSettings({
          system_prompt: d.system_prompt ?? DEFAULT_SETTINGS.system_prompt,
          max_tokens: typeof d.max_tokens === 'number' ? d.max_tokens : DEFAULT_SETTINGS.max_tokens,
          tts_model: d.tts_model ?? DEFAULT_SETTINGS.tts_model,
          tts_voice: d.tts_voice ?? DEFAULT_SETTINGS.tts_voice,
        });
      }
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; message?: string };
      if (err.response?.status === 404 || err.response?.status === 501) {
        setSettings(DEFAULT_SETTINGS);
        setError(null);
      } else {
        setError(err.message || 'Impossible de charger les paramètres Léa.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCapabilities = useCallback(async () => {
    setCapabilitiesLoading(true);
    try {
      const res = await apiClient.get<{ capabilities: LeaCapability[] }>('/v1/lea/capabilities');
      if (res.data?.capabilities) {
        setCapabilities(res.data.capabilities);
      }
    } catch (e) {
      setCapabilities([]);
    } finally {
      setCapabilitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadCapabilities();
  }, [loadCapabilities]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.put('/v1/lea/settings', settings);
      setSuccess('Paramètres enregistrés.');
    } catch (e: unknown) {
      const err = e as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      if (err.response?.status === 501) {
        setError('L’enregistrement des paramètres n’est pas encore disponible côté serveur. Utilisez les variables d’environnement (LEA_*) pour l’instant.');
      } else {
        setError(err.response?.data?.detail || err.message || 'Erreur lors de l’enregistrement.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSuccess(null);
    setError(null);
  };

  const handleCheckAction = async (actionId: string) => {
    setCheckLoading((prev) => ({ ...prev, [actionId]: true }));
    setCheckResults((prev) => ({ ...prev, [actionId]: undefined as unknown as CapabilityCheckResult }));
    try {
      const res = await apiClient.post<CapabilityCheckResult>('/v1/lea/capabilities/check', {
        action_id: actionId,
      });
      const result = res.data;
      setCheckResults((prev) => ({ ...prev, [actionId]: result }));
      if (!result.ok && result.message) {
        window.alert(result.message);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      const msg = err.response?.data?.detail || err.message || 'Erreur lors de la vérification.';
      setCheckResults((prev) => ({ ...prev, [actionId]: { ok: false, message: msg } }));
      window.alert(msg);
    } finally {
      setCheckLoading((prev) => ({ ...prev, [actionId]: false }));
    }
  };

  if (loading) {
    return (
      <Container className="py-8">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Chargement des paramètres…</span>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-primary-500" />
          Paramètres Léa
        </h1>
        <p className="text-muted-foreground">
          Instructions, comportement et options de synthèse vocale de l’assistante Léa. Réservé aux administrateurs.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm">
          {success}
        </div>
      )}

      <Tabs
        defaultTab="general"
        variant="underline"
        tabs={[
          {
            id: 'general',
            label: 'Général',
            content: (
              <Card className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Instructions / Prompt système
                  </label>
                  <textarea
                    value={settings.system_prompt}
                    onChange={(e) => setSettings((s) => ({ ...s, system_prompt: e.target.value }))}
                    rows={12}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                    placeholder="Tu es Léa, assistante..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Définit le rôle, le ton et les consignes de Léa. Utilisé à chaque conversation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Max tokens (réponses)</label>
                    <Input
                      type="number"
                      min={64}
                      max={1024}
                      value={String(settings.max_tokens)}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, max_tokens: Math.max(64, Math.min(1024, Number(e.target.value) || 256)) }))
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">Longueur max des réponses (64–1024).</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Modèle TTS</label>
                    <select
                      value={settings.tts_model}
                      onChange={(e) => setSettings((s) => ({ ...s, tts_model: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {TTS_MODELS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Voix TTS</label>
                    <select
                      value={settings.tts_voice}
                      onChange={(e) => setSettings((s) => ({ ...s, tts_voice: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {TTS_VOICES.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Nova et Shimmer sont des voix féminines.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Enregistrer
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={saving} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Réinitialiser
                  </Button>
                </div>
              </Card>
            ),
          },
          {
            id: 'actions',
            label: 'Actions',
            icon: <Zap className="w-4 h-4" />,
            content: (
              <Card className="p-6">
                <p className="text-muted-foreground mb-6">
                  Actions que Léa peut effectuer. Utilisez le bouton « Vérifier » pour contrôler que l'agent IA a bien
                  les accès et peut exécuter l'action. En cas de problème, une alerte expliquera la cause.
                </p>
                {capabilitiesLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Chargement des actions…</span>
                  </div>
                ) : capabilities.length === 0 ? (
                  <p className="text-muted-foreground py-4">Aucune action configurée.</p>
                ) : (
                  <ul className="space-y-4">
                    {capabilities.map((cap) => (
                      <li
                        key={cap.id}
                        className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground">{cap.label}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">{cap.description}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckAction(cap.id)}
                            disabled={checkLoading[cap.id]}
                            className="gap-2 shrink-0"
                          >
                            {checkLoading[cap.id] ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Vérifier
                          </Button>
                        </div>
                        {checkResults[cap.id] !== undefined && (() => {
                          const result = checkResults[cap.id]!;
                          return (
                            <div
                              className={
                                result.ok
                                  ? 'flex items-center gap-2 text-sm text-green-700 dark:text-green-400'
                                  : 'flex items-center gap-2 text-sm text-red-700 dark:text-red-400'
                              }
                            >
                              {result.ok ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 shrink-0" />
                              )}
                              <span>{result.message ?? (result.ok ? 'OK' : 'Erreur')}</span>
                            </div>
                          );
                        })()}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            ),
          },
        ]}
      />
    </Container>
  );
}
