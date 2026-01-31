/**
 * Profile Settings Page
 *
 * User account settings and preferences page.
 * Allows users to manage their account preferences, timezone, language, etc.
 * Accessible via profile navigation.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { PreferencesManager } from '@/components/preferences';
import { UserSettings } from '@/components/settings';
import { PageHeader, PageContainer, Section } from '@/components/layout';
import { Loading, Alert, Tabs, TabList, Tab, TabPanels, TabPanel } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { usersAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

interface UserData {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar?: string;
  phone?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export default function ProfileSettingsPage() {
  const router = useRouter();
  const t = useTranslations('profile.settings');
  const { isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadUser();
  }, [isAuthenticated, router]);

  const loadUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getMe();
      if (response.data) {
        setUser({
          ...response.data,
          name:
            [response.data.first_name, response.data.last_name].filter(Boolean).join(' ') ||
            response.data.email.split('@')[0],
        });
      }
    } catch (error) {
      logger.error(
        'Failed to load user settings',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSettingsSave = async (data: {
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) => {
    try {
      // Convert name back to first_name and last_name
      const nameParts = data.name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const updateData: { first_name?: string; last_name?: string; email?: string } = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (data.email) updateData.email = data.email;

      const response = await usersAPI.updateMe(updateData);

      if (response.data) {
        const updatedUser = {
          ...response.data,
          name:
            [response.data.first_name, response.data.last_name].filter(Boolean).join(' ') ||
            response.data.email?.split('@')[0] ||
            '',
          phone: data.phone,
          bio: data.bio,
          location: data.location,
          website: data.website,
        };

        setUser(updatedUser);
        logger.info('User settings updated successfully');
      }
    } catch (error: unknown) {
      logger.error(
        'Failed to update user settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.updateFailed') ||
        'Failed to update settings. Please try again.';
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

  if (!user) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <PageHeader
            title={t('title') || 'Settings'}
            description={t('description') || 'Manage your account settings'}
          />
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('errors.loadFailed') || 'Failed to load settings'}
            </p>
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Settings'}
          description={t('description') || 'Manage your account settings and preferences'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.profile') || 'Profile', href: '/profile' },
            { label: t('breadcrumbs.settings') || 'Settings' },
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
              <Tab value="account">{t('tabs.account') || 'Account'}</Tab>
              <Tab value="preferences">{t('tabs.preferences') || 'Preferences'}</Tab>
            </TabList>

            <TabPanels>
              {/* Account Settings Tab */}
              <TabPanel value="account">
                <Section title={t('sections.account') || 'Account Information'} className="mt-6">
                  <UserSettings
                    user={{
                      id: String(user.id),
                      name: user.name || (user.email ? user.email.split('@')[0] || '' : ''),
                      email: user.email || '',
                      phone: user.phone || undefined,
                      avatar: user.avatar || undefined,
                      bio: user.bio || undefined,
                      location: user.location || undefined,
                      website: user.website || undefined,
                    }}
                    onSave={handleUserSettingsSave}
                  />
                </Section>
              </TabPanel>

              {/* Preferences Tab */}
              <TabPanel value="preferences">
                <Section title={t('sections.preferences') || 'User Preferences'} className="mt-6">
                  <PreferencesManager />
                </Section>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
