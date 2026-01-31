/** * Onboarding Complete Component * * Final step of onboarding - completion screen. * * @component */ 'use client';
import { Card, Button } from '@/components/ui';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
export interface OnboardingCompleteProps {
  onFinish?: () => void;
  className?: string;
}
/** * Onboarding Complete Component * * Displays completion message and next steps. */ export default function OnboardingComplete({
  onFinish,
  className,
}: OnboardingCompleteProps) {
  const router = useRouter();
  const handleFinish = () => {
    if (onFinish) {
      onFinish();
    } else {
      router.push('/dashboard');
    }
  };
  return (
    <div className={className}>
      {' '}
      <Card className="max-w-2xl mx-auto text-center">
        {' '}
        <div className="mb-6">
          {' '}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-100 dark:bg-success-900/40 mb-4">
            {' '}
            <CheckCircle className="w-10 h-10 text-success-600 dark:text-success-400" />{' '}
          </div>{' '}
        </div>{' '}
        <h1 className="text-3xl font-bold text-foreground mb-4"> You're All Set! </h1>{' '}
        <p className="text-lg text-muted-foreground mb-8">
          {' '}
          Your account has been set up successfully. You're ready to start using the platform.{' '}
        </p>{' '}
        <div className="space-y-4 mb-8 text-left max-w-md mx-auto">
          {' '}
          <div className="flex items-start gap-3">
            {' '}
            <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />{' '}
            <div>
              {' '}
              <h3 className="font-medium text-foreground">Profile configured</h3>{' '}
              <p className="text-sm text-muted-foreground">Your profile is ready</p>{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-start gap-3">
            {' '}
            <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />{' '}
            <div>
              {' '}
              <h3 className="font-medium text-foreground">Preferences saved</h3>{' '}
              <p className="text-sm text-muted-foreground">Your settings are configured</p>{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-start gap-3">
            {' '}
            <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 mt-0.5 flex-shrink-0" />{' '}
            <div>
              {' '}
              <h3 className="font-medium text-foreground">Ready to go</h3>{' '}
              <p className="text-sm text-muted-foreground">Start exploring the platform</p>{' '}
            </div>{' '}
          </div>{' '}
        </div>{' '}
        <div className="flex gap-4 justify-center">
          {' '}
          <Button variant="primary" onClick={handleFinish}>
            {' '}
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />{' '}
          </Button>{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
