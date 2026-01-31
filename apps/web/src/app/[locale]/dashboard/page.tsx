'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, Badge, Button, LoadingSkeleton, Grid, Stack } from '@/components/ui';
import { StatsCard, MetricCard, WidgetGrid } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Link } from '@/i18n/routing';
import dynamicImport from 'next/dynamic';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import MotionDiv from '@/components/motion/MotionDiv';
import LeaChat from '@/components/lea/LeaChat';
import {
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Settings,
  Activity,
  Database,
  Shield,
  Sparkles,
  Zap,
  TrendingUp,
  FileText,
  Folder,
} from 'lucide-react';

// Lazy load TemplateAIChat to avoid circular dependency issues during build
const TemplateAIChat = dynamicImport(
  () => import('@/components/ai/TemplateAIChat').then((mod) => ({ default: mod.TemplateAIChat })),
  { ssr: false }
);

function DashboardContent() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-2xl">
        <div>
          <LoadingSkeleton variant="custom" className="h-10 w-64 mb-2" />
          <LoadingSkeleton variant="custom" className="h-6 w-96" />
        </div>
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="normal">
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
          <LoadingSkeleton variant="card" className="h-32" />
        </Grid>
        <LoadingSkeleton variant="card" count={2} />
      </div>
    );
  }

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      {/* Welcome Header */}
      <MotionDiv variant="fade" delay={100}>
        <PageHeader
          title={`Welcome back, ${user?.name || 'User'}!`}
          description="Here's what's happening with your account today"
          breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
        />
      </MotionDiv>

      {/* Léa AI Assistant - En haut du dashboard */}
      <MotionDiv variant="slideUp" delay={150}>
        <Card className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-gray-800 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Léa - Assistante AI
              </h3>
              <p className="text-sm text-gray-400">Votre assistante intelligente spécialisée dans l'immobilier</p>
            </div>
          </div>
          <div className="h-[400px]">
            <LeaChat />
          </div>
        </Card>
      </MotionDiv>

      {/* Quick Stats Grid - Using new StatsCard components */}
      <MotionDiv variant="slideUp" delay={200}>
        <WidgetGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={6}>
          <WidgetGrid.Item size="md">
            <StatsCard
              title="Resources"
              value="0"
              icon={<Sparkles className="w-5 h-5" />}
              variant="primary"
            />
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <StatsCard
              title="Files"
              value="0"
              icon={<FileText className="w-5 h-5" />}
              variant="default"
            />
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <StatsCard
              title="Activities"
              value="0"
              icon={<Activity className="w-5 h-5" />}
              variant="info"
            />
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <StatsCard
              title="Growth"
              value="+12%"
              trend="+12%"
              trendDirection="up"
              icon={<TrendingUp className="w-5 h-5" />}
              variant="success"
            />
          </WidgetGrid.Item>
        </WidgetGrid>
      </MotionDiv>

      <MotionDiv variant="slideUp" delay={300}>
        <WidgetGrid columns={{ sm: 1, md: 2 }} gap={6}>
          {/* User Profile Metric Card */}
          <WidgetGrid.Item size="md">
            <MetricCard
              title="Your Profile"
              subtitle="Account information"
              value={user?.name || 'N/A'}
              icon={<User className="w-5 h-5" />}
              subMetrics={[
                { label: 'Email', value: user?.email || 'N/A' },
                { label: 'Status', value: user?.is_active ? 'Active' : 'Inactive', trend: user?.is_active ? 'up' : 'neutral' },
                { label: 'Verified', value: user?.is_verified ? 'Yes' : 'No', trend: user?.is_verified ? 'up' : 'neutral' },
              ]}
              variant="default"
            />
          </WidgetGrid.Item>

          {/* Quick Actions Card */}
          <WidgetGrid.Item size="md">
            <Card variant="gradient" className="hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary-600 dark:bg-primary-500 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Quick Actions</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Access frequently used features</p>
                </div>
              </div>
              <Stack gap="normal">
                <Link href="/admin">
                  <Button
                    variant="primary"
                    className="w-full justify-start gap-3 h-auto py-3 hover:scale-[1.02] transition-transform"
                  >
                    <Settings className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Espace Admin</div>
                      <div className="text-xs opacity-90">Manage system settings</div>
                    </div>
                  </Button>
                </Link>
              </Stack>
            </Card>
          </WidgetGrid.Item>
        </WidgetGrid>
      </MotionDiv>

      {/* System Status - Using MetricCard */}
      <MotionDiv variant="slideUp" delay={400}>
        <Card variant="elevated" className="hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">System Status</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">All systems operational</p>
            </div>
          </div>
          <WidgetGrid columns={{ sm: 1, md: 3 }} gap={6}>
            <WidgetGrid.Item size="md">
              <MetricCard
                title="Backend"
                value="Connected"
                subtitle="API is running"
                icon={<CheckCircle2 className="w-5 h-5" />}
                trend="up"
                variant="success"
              />
            </WidgetGrid.Item>
            <WidgetGrid.Item size="md">
              <MetricCard
                title="Database"
                value="Connected"
                subtitle="PostgreSQL is running"
                icon={<Database className="w-5 h-5" />}
                trend="up"
                variant="success"
              />
            </WidgetGrid.Item>
            <WidgetGrid.Item size="md">
              <MetricCard
                title="Authentication"
                value="Working"
                subtitle="JWT is working"
                icon={<Shield className="w-5 h-5" />}
                trend="up"
                variant="success"
              />
            </WidgetGrid.Item>
          </WidgetGrid>
        </Card>
      </MotionDiv>

      {/* AI Chat Assistant */}
      <MotionDiv variant="slideUp" delay={600}>
        <Card className="hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Get help with your questions</p>
            </div>
          </div>
          <TemplateAIChat />
        </Card>
      </MotionDiv>
    </MotionDiv>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
