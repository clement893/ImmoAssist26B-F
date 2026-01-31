'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, Badge, Button, LoadingSkeleton, Grid, Stack } from '@/components/ui';
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

      {/* Quick Stats Grid */}
      <MotionDiv variant="slideUp" delay={200}>
        <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="normal">
          <Card className="border-l-4 border-l-primary-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Resources</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Sparkles className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-secondary-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Files</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="p-3 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                <Zap className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-info-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Activities</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="p-3 bg-info-100 dark:bg-info-900/30 rounded-lg">
                <Activity className="w-6 h-6 text-info-600 dark:text-info-400" />
              </div>
            </div>
          </Card>
          <Card className="border-l-4 border-l-success-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Growth</p>
                <p className="text-3xl font-bold text-foreground">+12%</p>
              </div>
              <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
                <TrendingUp className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
            </div>
          </Card>
        </Grid>
      </MotionDiv>

      <MotionDiv variant="slideUp" delay={300}>
        <Grid columns={{ mobile: 1, tablet: 2 }} gap="loose">
          {/* User Profile Card */}
          <Card className="hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Your Profile</h3>
                <p className="text-sm text-muted-foreground">Account information</p>
              </div>
            </div>
            <Stack gap="normal">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <User className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Name
                  </p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {user?.name || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Email
                  </p>
                  <p className="text-base font-semibold text-foreground mt-0.5">
                    {user?.email || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {user?.is_active ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Status
                    </p>
                    <Badge variant={user?.is_active ? 'success' : 'default'} className="mt-0.5">
                      {user?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {user?.is_verified ? (
                    <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Verified
                    </p>
                    <Badge variant={user?.is_verified ? 'success' : 'default'} className="mt-0.5">
                      {user?.is_verified ? 'Verified' : 'Not Verified'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Stack>
          </Card>

          {/* Quick Actions Card */}
          <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950/60 dark:to-primary-900/60 border-primary-200 dark:border-primary-800 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-primary-600 dark:bg-primary-500 rounded-lg">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Quick Actions</h3>
                <p className="text-sm text-muted-foreground">Access frequently used features</p>
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
        </Grid>
      </MotionDiv>

      {/* API Status */}
      <MotionDiv variant="slideUp" delay={400}>
        <Card className="hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-foreground">System Status</h3>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <Grid columns={{ mobile: 1, tablet: 3 }} gap="normal">
            <div className="p-4 bg-success-50 dark:bg-success-900/80 border-2 border-success-200 dark:border-success-800 rounded-lg hover:border-success-400 dark:hover:border-success-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="font-semibold text-success-900 dark:text-success-100">
                  Backend Connected
                </p>
              </div>
              <p className="text-sm text-success-800 dark:text-success-200 ml-8">API is running</p>
            </div>
            <div className="p-4 bg-success-50 dark:bg-success-900/80 border-2 border-success-200 dark:border-success-800 rounded-lg hover:border-success-400 dark:hover:border-success-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="font-semibold text-success-900 dark:text-success-100">
                  Database Connected
                </p>
              </div>
              <p className="text-sm text-success-800 dark:text-success-200 ml-8">
                PostgreSQL is running
              </p>
            </div>
            <div className="p-4 bg-success-50 dark:bg-success-900/80 border-2 border-success-200 dark:border-success-800 rounded-lg hover:border-success-400 dark:hover:border-success-600 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-success-600 dark:text-success-400" />
                <p className="font-semibold text-success-900 dark:text-success-100">
                  Authentication
                </p>
              </div>
              <p className="text-sm text-success-800 dark:text-success-200 ml-8">JWT is working</p>
            </div>
          </Grid>
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
