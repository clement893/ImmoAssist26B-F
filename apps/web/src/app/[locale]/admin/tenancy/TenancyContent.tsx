/**
 * Multi-Tenancy Configuration Page
 *
 * Admin page for configuring and demonstrating multi-tenancy features.
 * Uses existing UI components for consistent design.
 */

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, Alert, Select, Button, Input, Badge, useToast } from '@/components/ui';
import type { ColorVariant } from '@/components/ui/types';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Info, Database, Shield, Settings, CheckCircle, XCircle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface TenancyConfig {
  mode: 'single' | 'shared_db' | 'separate_db';
  enabled: boolean;
  registryUrl?: string;
  baseUrl?: string;
}

export default function TenancyContent() {
  const t = useTranslations('admin.tenancy');
  const { showToast } = useToast();

  const [config, setConfig] = useState<TenancyConfig>({
    mode: 'single',
    enabled: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: Replace with actual API endpoint when available
      // const response = await apiClient.get('/v1/admin/tenancy/config');
      // setConfig(response.data);

      // For now, simulate loading
      const mode = (process.env.NEXT_PUBLIC_TENANCY_MODE || 'single') as TenancyConfig['mode'];
      setConfig({
        mode,
        enabled: mode !== 'single',
        registryUrl: process.env.NEXT_PUBLIC_TENANT_DB_REGISTRY_URL,
        baseUrl: process.env.NEXT_PUBLIC_TENANT_DB_BASE_URL,
      });
    } catch (err) {
      logger.error(
        'Failed to load tenancy config',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(t('errors.loadFailed') || 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API endpoint when available
      // await apiClient.put('/v1/admin/tenancy/config', config);

      showToast({
        message: t('success.saved') || 'Configuration saved successfully',
        type: 'success',
      });
    } catch (err) {
      logger.error(
        'Failed to save tenancy config',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(t('errors.saveFailed') || 'Failed to save configuration');
      showToast({
        message: t('errors.saveFailed') || 'Failed to save configuration',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const getModeDescription = (mode: string) => {
    switch (mode) {
      case 'single':
        return t('modes.single.description') || 'No multi-tenancy. Single database, no filtering.';
      case 'shared_db':
        return (
          t('modes.shared_db.description') ||
          'Multi-tenancy with shared database. Data filtered by team_id.'
        );
      case 'separate_db':
        return (
          t('modes.separate_db.description') ||
          'Multi-tenancy with separate databases. One database per tenant.'
        );
      default:
        return '';
    }
  };

  const getModeBadgeVariant = (mode: string): ColorVariant => {
    switch (mode) {
      case 'single':
        return 'default';
      case 'shared_db':
        return 'info';
      case 'separate_db':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Multi-Tenancy Configuration'}
        description={t('description') || 'Configure and manage multi-tenancy settings'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.admin') || 'Admin', href: '/admin' },
          { label: t('breadcrumbs.tenancy') || 'Tenancy' },
        ]}
      />

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      <div className="space-y-6 mt-8">
        {/* Current Status */}
        <Section title={t('currentStatus') || 'Current Status'}>
          <Card>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('mode') || 'Mode'}</p>
                    <p className="text-sm text-muted-foreground">
                      {getModeDescription(config.mode)}
                    </p>
                  </div>
                </div>
                <Badge variant={getModeBadgeVariant(config.mode)}>
                  {config.mode.toUpperCase()}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('status') || 'Status'}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.enabled
                        ? t('enabled') || 'Multi-tenancy is enabled'
                        : t('disabled') || 'Multi-tenancy is disabled'}
                    </p>
                  </div>
                </div>
                {config.enabled ? (
                  <CheckCircle className="h-5 w-5 text-success-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </Card>
        </Section>

        {/* Configuration */}
        <Section title={t('configuration') || 'Configuration'}>
          <Card>
            <div className="space-y-6">
              <Alert variant="info" className="mb-4">
                <Info className="h-4 w-4 mr-2" />
                <span>
                  {t('info.configNote') ||
                    'Tenancy mode is configured via the TENANCY_MODE environment variable. Changes require server restart.'}
                </span>
              </Alert>

              <div>
                <Select
                  label={t('tenancyMode') || 'Tenancy Mode'}
                  value={config.mode}
                  onChange={(e) => {
                    const newMode = e.target.value as TenancyConfig['mode'];
                    setConfig({
                      ...config,
                      mode: newMode,
                      enabled: newMode !== 'single',
                    });
                  }}
                  options={[
                    { label: t('modes.single.label') || 'Single Tenant', value: 'single' },
                    { label: t('modes.shared_db.label') || 'Shared Database', value: 'shared_db' },
                    {
                      label: t('modes.separate_db.label') || 'Separate Databases',
                      value: 'separate_db',
                    },
                  ]}
                  helperText={getModeDescription(config.mode)}
                />
              </div>

              {config.mode === 'separate_db' && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <Input
                    label={t('registryUrl') || 'Registry Database URL'}
                    value={config.registryUrl || ''}
                    onChange={(e) => setConfig({ ...config, registryUrl: e.target.value })}
                    placeholder="postgresql://user:pass@host:5432/registry_db"
                    helperText={t('registryUrlHelper') || 'Database URL for tenant registry'}
                  />

                  <Input
                    label={t('baseUrl') || 'Base Database URL'}
                    value={config.baseUrl || ''}
                    onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
                    placeholder="postgresql://user:pass@host:5432"
                    helperText={
                      t('baseUrlHelper') ||
                      'Base URL for tenant databases (pattern: {base_url}/tenant_{id}_db)'
                    }
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="primary" onClick={handleSave} disabled={saving || loading}>
                  {saving ? t('saving') || 'Saving...' : t('save') || 'Save Configuration'}
                </Button>
                <Button variant="outline" onClick={loadConfig} disabled={loading || saving}>
                  {t('reload') || 'Reload'}
                </Button>
              </div>
            </div>
          </Card>
        </Section>

        {/* Information */}
        <Section title={t('information') || 'Information'}>
          <Card>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('modes.title') || 'Available Modes'}</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="default">SINGLE</Badge>
                      <span className="font-medium">
                        {t('modes.single.label') || 'Single Tenant'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('modes.single.description') ||
                        'No multi-tenancy. Single database, no filtering. Default mode.'}
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="info">SHARED_DB</Badge>
                      <span className="font-medium">
                        {t('modes.shared_db.label') || 'Shared Database'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('modes.shared_db.description') ||
                        'Multi-tenancy with shared database. All data in one database, filtered by team_id.'}
                    </p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success">SEPARATE_DB</Badge>
                      <span className="font-medium">
                        {t('modes.separate_db.label') || 'Separate Databases'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('modes.separate_db.description') ||
                        'Multi-tenancy with separate databases. One database per tenant for maximum isolation.'}
                    </p>
                  </div>
                </div>
              </div>

              <Alert variant="warning" className="mt-4">
                <Settings className="h-4 w-4 mr-2" />
                <div>
                  <p className="font-medium mb-1">{t('warning.title') || 'Important'}</p>
                  <p className="text-sm">
                    {t('warning.message') ||
                      'Changing tenancy mode requires database migrations and may affect existing data. Always backup your database before making changes.'}
                  </p>
                </div>
              </Alert>
            </div>
          </Card>
        </Section>
      </div>
    </PageContainer>
  );
}
