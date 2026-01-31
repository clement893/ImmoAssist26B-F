/**
 * Organization Settings Page
 *
 * Page for managing organization settings including name, logo, domain, etc.
 * Uses existing OrganizationSettings component.
 */

'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { OrganizationSettings } from '@/components/settings';
import type { OrganizationSettingsData } from '@/components/settings';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, Modal, Button } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { logger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/errors';
import {
  teamsAPI,
  type Team,
  type TeamSettings,
  type TeamListResponse,
  type TeamCreate,
} from '@/lib/api/teams';
import { Plus } from 'lucide-react';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const t = useTranslations('settings.organization');
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNoOrganization, setHasNoOrganization] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [organization, setOrganization] = useState<{
    id: string;
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    timezone?: string;
    locale?: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadOrganization();
  }, [isAuthenticated, router]);

  const loadOrganization = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user's teams and find the one they own
      const teamsResponse = await teamsAPI.getMyTeams();
      // apiClient.get returns response.data from axios, so response is directly TeamListResponse or ApiResponse<TeamListResponse>
      let teamsData: Team[] = [];

      if (!teamsResponse) {
        throw new Error('Failed to fetch teams: no response returned');
      }

      // Handle ApiResponse wrapper case
      if (typeof teamsResponse === 'object' && 'data' in teamsResponse && teamsResponse.data) {
        const responseData = teamsResponse.data as TeamListResponse;
        teamsData = responseData.teams || [];
      }
      // Handle direct TeamListResponse case
      else if (typeof teamsResponse === 'object' && 'teams' in teamsResponse) {
        teamsData = (teamsResponse as unknown as TeamListResponse).teams || [];
      }
      // Handle array case (fallback)
      else if (Array.isArray(teamsResponse)) {
        teamsData = teamsResponse;
      } else {
        logger.warn('Unexpected teams response format', teamsResponse);
        throw new Error('Failed to parse teams response: unexpected format');
      }

      if (teamsData.length === 0) {
        setHasNoOrganization(true);
        setIsLoading(false);
        return;
      }

      // Find the team where the user is the owner
      let userTeam: Team | null = null;

      // Get current user ID from auth store
      const currentUserId = user?.id ? parseInt(user.id, 10) : null;

      if (currentUserId) {
        // Find team where user is owner
        userTeam = teamsData.find((team: Team) => team.owner_id === currentUserId) || null;
      }

      // Fallback to first team if no owned team found
      if (!userTeam && teamsData.length > 0) {
        userTeam = teamsData[0] ?? null;
      }

      if (!userTeam) {
        setHasNoOrganization(true);
        setIsLoading(false);
        return;
      }

      setHasNoOrganization(false);

      // Parse settings from team
      let teamSettings: {
        email?: string;
        phone?: string;
        website?: string;
        address?: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postalCode: string;
          country: string;
        };
        timezone?: string;
        locale?: string;
      } = {};

      if (userTeam.settings && typeof userTeam.settings === 'object') {
        teamSettings = userTeam.settings as typeof teamSettings;
      } else if (typeof userTeam.settings === 'string') {
        try {
          teamSettings = JSON.parse(userTeam.settings);
        } catch (e) {
          logger.warn('Failed to parse team settings', e);
        }
      }

      // Parse address from JSON string if it exists
      let parsedAddress:
        | {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          }
        | undefined;

      if (teamSettings.address) {
        if (typeof teamSettings.address === 'string') {
          try {
            parsedAddress = JSON.parse(teamSettings.address);
          } catch (e) {
            logger.warn('Failed to parse address from settings', e);
          }
        } else if (typeof teamSettings.address === 'object') {
          parsedAddress = teamSettings.address;
        }
      }

      setOrganization({
        id: String(userTeam.id),
        name: userTeam.name,
        slug: userTeam.slug,
        email: teamSettings.email,
        phone: teamSettings.phone,
        website: teamSettings.website,
        address: parsedAddress,
        timezone: teamSettings.timezone || 'UTC',
        locale: teamSettings.locale || 'en-US',
      });
      setIsLoading(false);
    } catch (error: unknown) {
      logger.error(
        'Failed to load organization settings',
        error instanceof Error ? error : new Error(String(error))
      );

      // Check for 422 validation error specifically (settings field issue)
      const errorMessage = getErrorMessage(error);
      if (
        errorMessage?.includes('settings') ||
        errorMessage?.includes('dictionary') ||
        errorMessage?.includes('validation')
      ) {
        setError(
          "Erreur de validation des paramètres de l'organisation. Veuillez contacter le support si le problème persiste."
        );
      } else {
        setError(
          t('errors.loadFailed') || 'Failed to load organization settings. Please try again.'
        );
      }
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async (data: OrganizationSettingsData) => {
    try {
      setIsCreating(true);
      setError(null);

      // Generate slug from name if not provided
      const slug =
        data.slug ||
        data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

      // Prepare team settings
      const teamSettings: TeamSettings = {
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address ? JSON.stringify(data.address) : undefined,
        timezone: data.timezone,
        locale: data.locale,
      };

      // Create the team
      const teamData: TeamCreate = {
        name: data.name,
        slug: slug,
        description: data.description,
        settings: teamSettings,
      };

      const response = await teamsAPI.createTeam(teamData);

      // Parse response
      let newTeam: Team | null = null;
      if (!response) {
        throw new Error('Failed to create team: no response returned');
      }

      if (typeof response === 'object' && 'data' in response && response.data) {
        newTeam = response.data as Team;
      } else if (typeof response === 'object' && 'id' in response) {
        newTeam = response as unknown as Team;
      } else {
        logger.warn('Unexpected create team response format', response);
        throw new Error('Failed to parse create team response: unexpected format');
      }

      if (!newTeam) {
        throw new Error('Failed to create organization: no data returned');
      }

      // Parse settings from new team
      let teamSettingsParsed: TeamSettings = {};
      if (newTeam.settings && typeof newTeam.settings === 'object') {
        teamSettingsParsed = newTeam.settings as TeamSettings;
      } else if (typeof newTeam.settings === 'string') {
        try {
          teamSettingsParsed = JSON.parse(newTeam.settings) as TeamSettings;
        } catch (e) {
          logger.warn('Failed to parse new team settings', e);
        }
      }

      // Parse address from JSON string if it exists
      let parsedAddress:
        | {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          }
        | undefined;

      if (teamSettingsParsed.address && typeof teamSettingsParsed.address === 'string') {
        try {
          parsedAddress = JSON.parse(teamSettingsParsed.address);
        } catch (e) {
          logger.warn('Failed to parse address from settings', e);
        }
      }

      // Update local state with created organization
      setOrganization({
        id: String(newTeam.id),
        name: newTeam.name,
        slug: newTeam.slug,
        email: teamSettingsParsed.email as string | undefined,
        phone: teamSettingsParsed.phone as string | undefined,
        website: teamSettingsParsed.website as string | undefined,
        address: parsedAddress,
        timezone: (teamSettingsParsed.timezone as string | undefined) || 'UTC',
        locale: (teamSettingsParsed.locale as string | undefined) || 'en-US',
      });

      setHasNoOrganization(false);
      setShowCreateModal(false);
      logger.info('Organization created successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to create organization',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.createFailed') ||
        'Failed to create organization. Please try again.';
      setError(errorMessage);
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleSave = async (data: OrganizationSettingsData) => {
    try {
      setError(null);

      if (!organization || !organization.id) {
        throw new Error('Organization ID is missing. Please create an organization first.');
      }

      // Prepare team settings with additional information
      // Note: TeamSettings interface expects string | number | boolean | null | undefined
      // but address is an object, so we need to cast it
      const teamSettings: TeamSettings = {
        email: data.email,
        phone: data.phone,
        website: data.website,
        address: data.address ? JSON.stringify(data.address) : undefined,
        timezone: data.timezone,
        locale: data.locale,
      };

      // Get current team to preserve description
      const currentTeamResponse = await teamsAPI.getTeam(parseInt(organization.id, 10));
      // apiClient.get returns response.data from axios
      let currentTeam: Team | null = null;
      if (!currentTeamResponse) {
        throw new Error('Failed to fetch current team: no response returned');
      }

      if (
        typeof currentTeamResponse === 'object' &&
        'data' in currentTeamResponse &&
        currentTeamResponse.data
      ) {
        currentTeam = currentTeamResponse.data as Team;
      } else if (typeof currentTeamResponse === 'object' && 'id' in currentTeamResponse) {
        currentTeam = currentTeamResponse as unknown as Team;
      } else {
        logger.warn('Unexpected current team response format', currentTeamResponse);
        throw new Error('Failed to parse current team response: unexpected format');
      }

      // Update the team via Teams API
      const teamId = parseInt(organization.id, 10);
      const response = await teamsAPI.updateTeam(teamId, {
        name: data.name,
        description: currentTeam?.description || undefined,
        settings: teamSettings,
      });

      // apiClient.put returns response.data from axios
      if (!response) {
        throw new Error('Failed to update team: no response returned');
      }

      let updatedTeam: Team | null = null;
      if (typeof response === 'object' && 'data' in response && response.data) {
        updatedTeam = response.data as Team;
      } else if (typeof response === 'object' && 'id' in response) {
        updatedTeam = response as unknown as Team;
      } else {
        logger.warn('Unexpected update team response format', response);
        throw new Error('Failed to parse update team response: unexpected format');
      }

      if (!updatedTeam) {
        throw new Error('Failed to update organization: no data returned');
      }

      // Parse settings from updated team
      let teamSettingsParsed: TeamSettings = {};
      if (updatedTeam.settings && typeof updatedTeam.settings === 'object') {
        teamSettingsParsed = updatedTeam.settings as TeamSettings;
      } else if (typeof updatedTeam.settings === 'string') {
        try {
          teamSettingsParsed = JSON.parse(updatedTeam.settings) as TeamSettings;
        } catch (e) {
          logger.warn('Failed to parse updated team settings', e);
        }
      }

      // Parse address from JSON string if it exists
      let parsedAddress:
        | {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
          }
        | undefined;

      if (teamSettingsParsed.address && typeof teamSettingsParsed.address === 'string') {
        try {
          parsedAddress = JSON.parse(teamSettingsParsed.address);
        } catch (e) {
          logger.warn('Failed to parse address from settings', e);
        }
      }

      // Update local state with saved data
      setOrganization({
        id: String(updatedTeam.id),
        name: updatedTeam.name,
        slug: updatedTeam.slug,
        email: teamSettingsParsed.email as string | undefined,
        phone: teamSettingsParsed.phone as string | undefined,
        website: teamSettingsParsed.website as string | undefined,
        address: parsedAddress,
        timezone: (teamSettingsParsed.timezone as string | undefined) || 'UTC',
        locale: (teamSettingsParsed.locale as string | undefined) || 'en-US',
      });

      logger.info('Organization settings saved successfully');
    } catch (error: unknown) {
      logger.error(
        'Failed to save organization settings',
        error instanceof Error ? error : new Error(String(error))
      );
      const errorMessage =
        getErrorMessage(error) ||
        t('errors.saveFailed') ||
        'Failed to save organization settings. Please try again.';
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

  // Show create organization prompt if no organization exists
  if (hasNoOrganization || !organization) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <PageHeader
            title={t('title') || 'Organization Settings'}
            description={t('description') || 'Manage your organization settings and configuration'}
            breadcrumbs={[
              { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
              { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
              { label: t('breadcrumbs.organization') || 'Organization' },
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
            <div className="bg-background border border-border rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold mb-2">
                {t('noOrganization.title') || 'No Organization Found'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('noOrganization.description') ||
                  'You need to create an organization to manage settings. Click the button below to get started.'}
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('noOrganization.createButton') || 'Create Organization'}
              </Button>
            </div>
          </div>

          {/* Create Organization Modal */}
          <Modal
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setError(null);
            }}
            title={t('createModal.title') || 'Create Organization'}
            size="lg"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError(null);
                  }}
                  disabled={isCreating}
                >
                  {t('createModal.cancel') || 'Cancel'}
                </Button>
                <Button
                  onClick={() => {
                    // Trigger form submission - find the form inside the modal
                    const modalContent = document.querySelector('[data-create-org-form]');
                    const form = modalContent?.querySelector('form') as HTMLFormElement;
                    if (form) {
                      form.requestSubmit();
                    }
                  }}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loading className="w-4 h-4 mr-2" />
                      {t('createModal.creating') || 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('createModal.create') || 'Create'}
                    </>
                  )}
                </Button>
              </>
            }
          >
            <div className="max-h-[70vh] overflow-y-auto">
              <div data-create-org-form>
                <OrganizationSettings
                  organization={{
                    id: '',
                    name: '',
                    slug: '',
                  }}
                  onSave={handleCreateOrganization}
                />
              </div>
            </div>
          </Modal>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Organization Settings'}
          description={t('description') || 'Manage your organization settings and configuration'}
          breadcrumbs={[
            { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
            { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
            { label: t('breadcrumbs.organization') || 'Organization' },
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
          <ErrorBoundary>
            <OrganizationSettings organization={organization} onSave={handleSave} />
          </ErrorBoundary>
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
