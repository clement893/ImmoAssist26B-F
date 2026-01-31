/**
 * Security Settings Page
 *
 * Page for managing security settings including 2FA, sessions, etc.
 * Uses existing SecuritySettings component.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { SecuritySettings, APIKeys } from '@/components/settings';
import type { SecuritySettingsData, APIKey } from '@/components/settings';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.security');
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('security');
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    requireStrongPassword: true,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
  });
  const [apiKeys] = useState<APIKey[]>([]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadSecuritySettings();
  }, [isAuthenticated, router]);

  const loadSecuritySettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // API integration - Load security settings from API endpoint when available
      setIsLoading(false);
    } catch (error) {
      logger.error(
        'Failed to load security settings',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load security settings. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSecuritySave = async (data: SecuritySettingsData) => {
    try {
      setError(null);
      // API integration - Save security settings to API endpoint when available
      setSecuritySettings({
        twoFactorEnabled: data.twoFactorEnabled,
        sessionTimeout: data.sessionTimeout ?? 30,
        requireStrongPassword: data.requireStrongPassword,
        loginNotifications: data.loginNotifications,
        suspiciousActivityAlerts: data.suspiciousActivityAlerts,
      });
      logger.info('Security settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save security settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.saveFailed') ||
        'Failed to save security settings. Please try again.';
      setError(errorMessage);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Security Settings'}
          description={t('description') || 'Manage your security settings, 2FA, and API keys'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.security') || 'Security' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <Tabs defaultTab={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab value="security">{t('tabs.security') || 'Security'}</Tab>
              <Tab value="apiKeys">{t('tabs.apiKeys') || 'API Keys'}</Tab>
            </TabList>

            <TabPanels>
              <TabPanel value="security">
                <Section title={t('sections.security') || 'Security Settings'} className="mt-6">
                  <SecuritySettings settings={securitySettings} onSave={handleSecuritySave} />
                </Section>
              </TabPanel>

              <TabPanel value="apiKeys">
                <Section title={t('sections.apiKeys') || 'API Keys'} className="mt-6">
                  <APIKeys
                    apiKeys={apiKeys}
                    onCreate={async (name: string, scopes: string[]) => {
                      // API integration - Implement API key creation when backend endpoint is available
                      return {
                        id: '',
                        name,
                        key: '',
                        prefix: '',
                        createdAt: new Date().toISOString(),
                        scopes,
                      };
                    }}
                    onDelete={async (_id: string) => {
                      // API integration - Implement API key deletion when backend endpoint is available
                    }}
                    onRevoke={async (_id: string) => {
                      // API integration - Implement API key revocation when backend endpoint is available
                    }}
                  />
                </Section>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
