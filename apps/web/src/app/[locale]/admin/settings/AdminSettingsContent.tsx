'use client';

import { useState, useEffect } from 'react';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Button, Card, Alert, Input, Switch } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';

export default function AdminSettingsContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    maintenance_mode: false,
    registration_enabled: true,
    email_verification_required: true,
    api_rate_limit: 100,
    session_timeout: 3600,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    // TODO: Load actual system settings from API when endpoint is available
    // For now, use default values
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Implement API endpoint for system settings
      // const response = await fetch(`${getApiUrl()}/api/v1/admin/settings`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(settings),
      // });

      // Simulate save for now
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Erreur lors de la sauvegarde des paramètres'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Paramètres système"
        description="Configuration générale du système"
        breadcrumbs={[
          { label: 'Accueil', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Paramètres' },
        ]}
      />

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-4">
          Paramètres mis à jour avec succès
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Section title="Général" className="mt-6">
          <Card className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Mode maintenance</label>
                <p className="text-sm text-muted-foreground mt-1">
                  Active le mode maintenance pour restreindre l'accès au système
                </p>
              </div>
              <Switch
                checked={settings.maintenance_mode}
                onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">Inscriptions activées</label>
                <p className="text-sm text-muted-foreground mt-1">
                  Permet aux nouveaux utilisateurs de s'inscrire
                </p>
              </div>
              <Switch
                checked={settings.registration_enabled}
                onChange={(e) =>
                  setSettings({ ...settings, registration_enabled: e.target.checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Vérification email requise
                </label>
                <p className="text-sm text-muted-foreground mt-1">
                  Les utilisateurs doivent vérifier leur email pour activer leur compte
                </p>
              </div>
              <Switch
                checked={settings.email_verification_required}
                onChange={(e) =>
                  setSettings({ ...settings, email_verification_required: e.target.checked })
                }
              />
            </div>
          </Card>
        </Section>

        <Section title="Sécurité" className="mt-6">
          <Card className="p-6 space-y-6">
            <Input
              label="Limite de taux API (requêtes/minute)"
              type="number"
              value={settings.api_rate_limit}
              onChange={(e) =>
                setSettings({ ...settings, api_rate_limit: parseInt(e.target.value) || 100 })
              }
              min={1}
              max={10000}
            />

            <Input
              label="Timeout de session (secondes)"
              type="number"
              value={settings.session_timeout}
              onChange={(e) =>
                setSettings({ ...settings, session_timeout: parseInt(e.target.value) || 3600 })
              }
              min={300}
              max={86400}
            />
          </Card>
        </Section>

        <div className="mt-6 flex justify-end">
          <Button type="submit" variant="primary" loading={loading}>
            Enregistrer les paramètres
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
