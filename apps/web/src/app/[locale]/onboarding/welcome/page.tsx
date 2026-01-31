/**
 * Onboarding Welcome Page
 *
 * Standalone welcome page for onboarding.
 */

'use client';

import { useRouter } from 'next/navigation';
import { WelcomeScreen } from '@/components/onboarding';
import { PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingWelcomePage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center py-12">
          <WelcomeScreen
            onNext={() => router.push('/onboarding/profile')}
            onSkip={() => router.push('/dashboard')}
          />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
