/**
 * Onboarding Page
 *
 * Main onboarding wizard page.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  WelcomeScreen,
  ProfileSetup,
  PreferencesSetup,
  TeamSetup,
  OnboardingComplete,
} from '@/components/onboarding';
import type { ProfileData, PreferencesData, TeamMember } from '@/components/onboarding';
import { PageContainer } from '@/components/layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<{
    profile?: ProfileData;
    preferences?: PreferencesData;
    team?: { teamName: string; members: TeamMember[] };
  }>({});

  const steps = [
    {
      id: 'welcome',
      component: WelcomeScreen,
      props: {
        onNext: () => setCurrentStep(1),
        onSkip: () => router.push('/dashboard'),
      },
    },
    {
      id: 'profile',
      component: ProfileSetup,
      props: {
        initialData: onboardingData.profile,
        onNext: (data: ProfileData) => {
          setOnboardingData({ ...onboardingData, profile: data });
          setCurrentStep(2);
        },
        onPrevious: () => setCurrentStep(0),
        onSkip: () => setCurrentStep(2),
      },
    },
    {
      id: 'preferences',
      component: PreferencesSetup,
      props: {
        initialData: onboardingData.preferences,
        onNext: (data: PreferencesData) => {
          setOnboardingData({ ...onboardingData, preferences: data });
          setCurrentStep(3);
        },
        onPrevious: () => setCurrentStep(1),
        onSkip: () => setCurrentStep(3),
      },
    },
    {
      id: 'team',
      component: TeamSetup,
      props: {
        initialData: onboardingData.team,
        onNext: (data: { teamName: string; members: TeamMember[] }) => {
          setOnboardingData({ ...onboardingData, team: data });
          setCurrentStep(4);
        },
        onPrevious: () => setCurrentStep(2),
        onSkip: () => setCurrentStep(4),
      },
    },
    {
      id: 'complete',
      component: OnboardingComplete,
      props: {
        onFinish: () => router.push('/dashboard'),
      },
    },
  ];

  const CurrentStepComponent = steps[currentStep]?.component;
  const currentStepProps = steps[currentStep]?.props || {};

  return (
    <ProtectedRoute>
      <PageContainer>
        <div className="min-h-screen flex items-center justify-center py-12">
          {CurrentStepComponent && <CurrentStepComponent {...currentStepProps} />}
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
