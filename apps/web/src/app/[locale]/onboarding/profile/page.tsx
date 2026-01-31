/**
 * Onboarding Profile Setup Page
 *
 * Standalone profile setup page for onboarding.
 */

'use client';

import { useRouter } from 'next/navigation';
import { ProfileSetup } from '@/components/onboarding';
import { PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingProfilePage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center py-12">
          <ProfileSetup
            onNext={() => router.push('/onboarding/preferences')}
            onPrevious={() => router.push('/onboarding/welcome')}
            onSkip={() => router.push('/onboarding/preferences')}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
