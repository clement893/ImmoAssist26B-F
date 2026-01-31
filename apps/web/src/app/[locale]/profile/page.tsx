/**
 * Profile Page
 *
 * Complete user profile page displaying all profile information from database
 * with edit capabilities for modifiable fields.
 * Accessible via dashboard navigation and sitemap.
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { usersAPI } from '@/lib/api';
import { ProfileCard, ProfileForm } from '@/components/profile';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, Card } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { sanitizeInput } from '@/utils/edgeCaseHandlers';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import { Calendar, Mail, CheckCircle, XCircle, Clock, Hash } from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  avatar?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('profile');
  const { user: authUser, isAuthenticated } = useAuthStore();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const profileFormRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await usersAPI.getMe();
      if (response.data) {
        const userData = response.data;
        setUser({
          id: userData.id,
          email: userData.email,
          first_name: userData.first_name || undefined,
          last_name: userData.last_name || undefined,
          name:
            [userData.first_name, userData.last_name].filter(Boolean).join(' ') ||
            userData.email.split('@')[0],
          avatar: userData.avatar || undefined,
          is_active: userData.is_active !== undefined ? userData.is_active : true,
          created_at: userData.created_at || undefined,
          updated_at: userData.updated_at || undefined,
        });
      }
    } catch (error) {
      logger.error(
        'Failed to load user profile',
        error instanceof Error ? error : new Error(String(error))
      );
      setError(t('errors.loadFailed') || 'Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadUser();
  }, [isAuthenticated, router, loadUser]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const handleSubmit = async (data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar?: string;
  }) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      // Sanitize input data
      const updateData: {
        first_name?: string;
        last_name?: string;
        email?: string;
        avatar?: string;
      } = {};

      if (data.first_name !== undefined) {
        updateData.first_name = sanitizeInput(data.first_name, { maxLength: 100, trim: true });
      }
      if (data.last_name !== undefined) {
        updateData.last_name = sanitizeInput(data.last_name, { maxLength: 100, trim: true });
      }
      if (data.email !== undefined) {
        updateData.email = sanitizeInput(data.email, { maxLength: 255, trim: true }).toLowerCase();
      }
      if (data.avatar !== undefined && user && data.avatar !== user.avatar) {
        // Only update avatar if it's a URL (not a data URL from preview)
        if (data.avatar.startsWith('http://') || data.avatar.startsWith('https://')) {
          updateData.avatar = data.avatar;
        }
      }

      logger.debug('Updating user profile', { fields: Object.keys(updateData) });

      const response = await usersAPI.updateMe(updateData);

      if (response.data) {
        const updatedUser = {
          ...response.data,
          name:
            [response.data.first_name, response.data.last_name].filter(Boolean).join(' ') ||
            response.data.email?.split('@')[0] ||
            '',
        };

        const updatedUserData: UserData = {
          ...updatedUser,
          id: response.data.id,
          email: response.data.email,
          first_name: response.data.first_name || undefined,
          last_name: response.data.last_name || undefined,
          avatar: response.data.avatar || undefined,
          is_active: response.data.is_active !== undefined ? response.data.is_active : true,
          created_at: response.data.created_at || user?.created_at,
          updated_at: response.data.updated_at || new Date().toISOString(),
        };

        setUser(updatedUserData);

        // Update auth store only if authUser exists
        if (authUser) {
          useAuthStore.getState().setUser({
            ...authUser,
            ...response.data,
            name: updatedUser.name,
          });
        }

        setSuccess(t('success.updateSuccess') || 'Profile updated successfully');
        logger.info('Profile updated successfully', { email: response.data.email });

        // Data is already updated in state, no need to reload from database
        // The response.data already contains the latest information
      }
    } catch (error: unknown) {
      logger.error(
        'Failed to update profile',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.updateFailed') ||
        'Failed to update profile. Please try again.';
      setError(errorMessage);
      // Don't throw - error is already handled via setError state
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = useCallback(
    (dateString?: string) => {
      if (!dateString) return 'N/A';
      try {
        const dateLocale = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'en-US';
        return new Date(dateString).toLocaleDateString(dateLocale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return dateString;
      }
    },
    [locale]
  );

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
            title={t('title') || 'Profile'}
            description={t('description') || 'User profile page'}
          />
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t('errors.loadFailed') || 'Failed to load profile'}
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
          title={t('title') || 'Profile'}
          description={t('description') || 'Manage your profile information and account settings'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.profile') || 'Profile' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div className="mt-6">
            <Alert variant="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Profile Card */}
          <ProfileCard
            user={user}
            onEdit={() => {
              logger.debug('Edit profile button clicked, scrolling to form');
              if (profileFormRef.current) {
                const element = profileFormRef.current;
                const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = elementPosition - 120; // 120px offset from top for header

                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth',
                });

                // Focus on first input field after scroll
                // Clear any existing timeout before setting a new one
                if (focusTimeoutRef.current) {
                  clearTimeout(focusTimeoutRef.current);
                }

                focusTimeoutRef.current = setTimeout(() => {
                  const firstInput = element.querySelector(
                    'input[type="text"], input[type="email"]'
                  ) as HTMLInputElement;
                  if (firstInput) {
                    firstInput.focus();
                    logger.debug('Focused on first input field');
                  }
                  focusTimeoutRef.current = null;
                }, 600);
              } else {
                logger.warn('profileFormRef.current is null');
              }
            }}
          />

          {/* Database Information Card */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5" />
              {t('databaseInfo.title') || 'Database Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('databaseInfo.userId') || 'User ID'}
                  </p>
                  <p className="font-medium">{user.id}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('databaseInfo.email') || 'Email'}
                  </p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                {user.is_active ? (
                  <CheckCircle className="w-4 h-4 mt-1 text-success-500" />
                ) : (
                  <XCircle className="w-4 h-4 mt-1 text-error-500" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('databaseInfo.status') || 'Status'}
                  </p>
                  <p className="font-medium">
                    {user.is_active ? (
                      <span className="text-success-600 dark:text-success-400">
                        {t('databaseInfo.active') || 'Active'}
                      </span>
                    ) : (
                      <span className="text-error-600 dark:text-error-400">
                        {t('databaseInfo.inactive') || 'Inactive'}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 mt-1 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t('databaseInfo.createdAt') || 'Created At'}
                  </p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>

              {user.updated_at && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <Clock className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {t('databaseInfo.updatedAt') || 'Last Updated'}
                    </p>
                    <p className="font-medium">{formatDate(user.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Profile Form */}
          <div id="profile-form" ref={profileFormRef}>
            <ProfileForm user={user} onSubmit={handleSubmit} isLoading={isSaving} />
          </div>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
