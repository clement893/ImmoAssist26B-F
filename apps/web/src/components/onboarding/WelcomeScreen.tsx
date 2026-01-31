/** * Welcome Screen Component * * First step of onboarding - welcome message. * * @component */ 'use client';
import { Card, Button } from '@/components/ui';
import { Sparkles, ArrowRight } from 'lucide-react';
export interface WelcomeScreenProps {
  onNext?: () => void;
  onSkip?: () => void;
  className?: string;
}
/** * Welcome Screen Component * * Displays welcome message and introduction. */ export default function WelcomeScreen({
  onNext,
  onSkip,
  className,
}: WelcomeScreenProps) {
  return (
    <div className={className}>
      {' '}
      <Card className="max-w-2xl mx-auto text-center">
        {' '}
        <div className="mb-6">
          {' '}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 mb-4">
            {' '}
            <Sparkles className="w-10 h-10 text-primary-600 dark:text-primary-400" />{' '}
          </div>{' '}
        </div>{' '}
        <h1 className="text-3xl font-bold text-foreground mb-4"> Welcome to Our Platform! </h1>{' '}
        <p className="text-lg text-muted-foreground mb-6">
          {' '}
          We're excited to have you here. Let's get you set up in just a few simple steps.{' '}
        </p>{' '}
        <div className="space-y-4 mb-8 text-left max-w-md mx-auto">
          {' '}
          <div className="flex items-start gap-3">
            {' '}
            <div className="w-6 h-6 rounded-full bg-primary-600 dark:bg-primary-500 text-background flex items-center justify-center flex-shrink-0 mt-0.5">
              {' '}
              1{' '}
            </div>{' '}
            <div>
              {' '}
              <h3 className="font-medium text-foreground">Set up your profile</h3>{' '}
              <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-start gap-3">
            {' '}
            <div className="w-6 h-6 rounded-full bg-primary-600 dark:bg-primary-500 text-background flex items-center justify-center flex-shrink-0 mt-0.5">
              {' '}
              2{' '}
            </div>{' '}
            <div>
              {' '}
              <h3 className="font-medium text-foreground">Configure preferences</h3>{' '}
              <p className="text-sm text-muted-foreground">Customize your experience</p>{' '}
            </div>{' '}
          </div>{' '}
          <div className="flex items-start gap-3">
            {' '}
            <div className="w-6 h-6 rounded-full bg-primary-600 dark:bg-primary-500 text-background flex items-center justify-center flex-shrink-0 mt-0.5">
              {' '}
              3{' '}
            </div>{' '}
            <div>
              {' '}
              <h3 className="font-medium text-foreground">Invite your team</h3>{' '}
              <p className="text-sm text-muted-foreground">Get your team started (optional)</p>{' '}
            </div>{' '}
          </div>{' '}
        </div>{' '}
        <div className="flex gap-4 justify-center">
          {' '}
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              {' '}
              Skip for now{' '}
            </Button>
          )}{' '}
          {onNext && (
            <Button variant="primary" onClick={onNext}>
              {' '}
              Get Started <ArrowRight className="w-4 h-4 ml-2" />{' '}
            </Button>
          )}{' '}
        </div>{' '}
      </Card>{' '}
    </div>
  );
}
