/**
 * Onboarding Complete Page
 *
 * Standalone completion page for onboarding.
 */

'use client';

import { useRouter } from 'next/navigation';
import { OnboardingComplete } from '@/components/onboarding';
import { PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingCompletePage() {
  const router = useRouter();

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center py-12">
          <OnboardingComplete onFinish={() => router.push('/dashboard')} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
