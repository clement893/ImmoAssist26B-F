/**
 * Onboarding Preferences Setup Page
 *
 * Standalone preferences setup page for onboarding.
 */

'use client';

import { useRouter } from 'next/navigation';
import { PreferencesSetup } from '@/components/onboarding';
import { PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingPreferencesPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center py-12">
          <PreferencesSetup
            onNext={() => router.push('/onboarding/team')}
            onPrevious={() => router.push('/onboarding/profile')}
            onSkip={() => router.push('/onboarding/team')}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
