/**
 * Onboarding Team Setup Page
 *
 * Standalone team setup page for onboarding.
 */

'use client';

import { useRouter } from 'next/navigation';
import { TeamSetup } from '@/components/onboarding';
import { PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingTeamPage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center py-12">
          <TeamSetup
            onNext={() => router.push('/onboarding/complete')}
            onPrevious={() => router.push('/onboarding/preferences')}
            onSkip={() => router.push('/onboarding/complete')}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
