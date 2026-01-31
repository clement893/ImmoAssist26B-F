'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useAuthStore } from '@/lib/store';
import { Card, Badge, Container, StatsCard, StatusCard, ServiceTestCard } from '@/components/ui';

function DashboardContent() {
  const { user } = useAuthStore();

  return (
    <Container className="py-8 lg:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* User Profile Card */}
        <Card title="Your Profile">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold text-foreground">{user?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-semibold text-foreground">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={user?.is_active ? 'success' : 'default'}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <Badge variant={user?.is_verified ? 'success' : 'default'}>
                {user?.is_verified ? '✓ Yes' : '✗ No'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card title="Quick Stats">
          <div className="space-y-4">
            <StatsCard
              title="Resources"
              value="0"
              className="bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800"
            />
            <StatsCard
              title="Files"
              value="0"
              className="bg-secondary-100 dark:bg-secondary-900/40 border-secondary-200 dark:border-secondary-800"
            />
            <StatsCard
              title="Activities"
              value="0"
              className="bg-info-100 dark:bg-info-900/40 border-info-200 dark:border-info-800"
            />
          </div>
        </Card>
      </div>

      {/* API Status */}
      <Card title="API Status" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard title="✓ Backend Connected" description="API is running" status="success" />
          <StatusCard
            title="✓ Database Connected"
            description="PostgreSQL is running"
            status="success"
          />
          <StatusCard title="✓ Authentication" description="JWT is working" status="success" />
        </div>
      </Card>

      {/* Test Pages */}
      <Card
        title="Service Tests"
        subtitle="Test and verify the configuration of integrated services"
        className="mt-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ServiceTestCard
            href="/ai/test"
            title="AI Test"
            description="Test OpenAI integration with chat completions and text generation"
            color="info"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
          />
          <ServiceTestCard
            href="/email/test"
            title="Email Test"
            description="Test SendGrid email service with test, welcome, and custom emails"
            color="secondary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            }
          />
          <ServiceTestCard
            href="/stripe/test"
            title="Stripe Test"
            description="Test Stripe integration for subscriptions and payment processing"
            color="success"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            }
          />
          <ServiceTestCard
            href="/auth/google/test"
            title="Google Auth Test"
            description="Test Google OAuth integration for authentication"
            color="warning"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            }
          />
          <ServiceTestCard
            href="/sentry/test"
            title="Sentry Test"
            description="Test Sentry error tracking and monitoring integration"
            color="error"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            }
          />
          <ServiceTestCard
            href="/upload"
            title="S3 Upload"
            description="Test AWS S3 file upload and management functionality"
            color="primary"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            }
          />
        </div>
      </Card>
    </Container>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
