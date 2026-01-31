'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, Button, LoadingSkeleton, Grid, Stack } from '@/components/ui';
import { StatsCard, MetricCard, WidgetGrid } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Link } from '@/i18n/routing';
import dynamicImport from 'next/dynamic';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import MotionDiv from '@/components/motion/MotionDiv';
import LeaChat from '@/components/lea/LeaChat';
import { getBrokerDashboardStats, BrokerDashboardStats } from '@/lib/api/dashboard';
import {
  Receipt,
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Sparkles,
  Zap,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// Lazy load TemplateAIChat to avoid circular dependency issues during build
const TemplateAIChat = dynamicImport(
  () => import('@/components/ai/TemplateAIChat').then((mod) => ({ default: mod.TemplateAIChat })),
  { ssr: false }
);

function DashboardContent() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<BrokerDashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getBrokerDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Error loading dashboard stats:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques');
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

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
          title={`Bienvenue, ${user?.name || 'Courtier'} !`}
          description="Vue d'ensemble de votre activité immobilière"
          breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Dashboard' }]}
        />
      </MotionDiv>

      {/* Léa AI Assistant - En haut du dashboard */}
      <MotionDiv variant="slideUp" delay={150}>
        <Card className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-gray-800 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
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

      {/* Statistiques principales - Transactions */}
      {error && (
        <MotionDiv variant="slideUp" delay={150}>
          <Card variant="elevated" className="border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400" />
              <p className="text-sm text-warning-800 dark:text-warning-200">{error}</p>
            </div>
          </Card>
        </MotionDiv>
      )}

      <MotionDiv variant="slideUp" delay={200}>
        <WidgetGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={6}>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/transactions">
              <StatsCard
                title="Transactions totales"
                value={stats?.total_transactions.toString() || '0'}
                icon={<Receipt className="w-5 h-5" />}
                variant="primary"
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            </Link>
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/transactions?status=En cours">
              <StatsCard
                title="Transactions actives"
                value={stats?.active_transactions.toString() || '0'}
                icon={<TrendingUp className="w-5 h-5" />}
                variant="success"
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            </Link>
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/transactions?status=Conditionnelle">
              <StatsCard
                title="Transactions conditionnelles"
                value={stats?.conditional_transactions.toString() || '0'}
                icon={<AlertCircle className="w-5 h-5" />}
                variant="warning"
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            </Link>
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/transactions?status=Conclue">
              <StatsCard
                title="Transactions conclues"
                value={stats?.closed_transactions.toString() || '0'}
                icon={<CheckCircle2 className="w-5 h-5" />}
                variant="default"
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            </Link>
          </WidgetGrid.Item>
        </WidgetGrid>
      </MotionDiv>

      {/* Statistiques secondaires - Contacts, Entreprises, Commissions */}
      <MotionDiv variant="slideUp" delay={250}>
        <WidgetGrid columns={{ sm: 1, md: 2, lg: 4 }} gap={6}>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/reseau/contacts">
              <StatsCard
                title="Contacts"
                value={stats?.total_contacts.toString() || '0'}
                icon={<Users className="w-5 h-5" />}
                variant="default"
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            </Link>
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/reseau/entreprises">
              <StatsCard
                title="Entreprises"
                value={stats?.total_companies.toString() || '0'}
                icon={<Building2 className="w-5 h-5" />}
                variant="default"
                className="cursor-pointer hover:shadow-lg transition-shadow"
              />
            </Link>
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <StatsCard
              title="Commissions totales"
              value={stats ? formatCurrency(stats.total_commission) : '$0'}
              icon={<DollarSign className="w-5 h-5" />}
              variant="success"
            />
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <StatsCard
              title="Commissions en attente"
              value={stats ? formatCurrency(stats.pending_commission) : '$0'}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="warning"
            />
          </WidgetGrid.Item>
        </WidgetGrid>
      </MotionDiv>

      {/* Actions rapides et informations */}
      <MotionDiv variant="slideUp" delay={300}>
        <WidgetGrid columns={{ sm: 1, md: 2 }} gap={4}>
          {/* Actions rapides */}
          <WidgetGrid.Item size="md">
            <Card variant="gradient" className="hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-600 dark:bg-primary-500 rounded-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Actions rapides</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Accès rapide aux fonctionnalités principales</p>
                </div>
              </div>
              <Stack gap="normal">
                <Link href="/dashboard/transactions">
                  <Button
                    variant="primary"
                    className="w-full justify-start gap-3 h-auto py-3 hover:scale-[1.02] transition-transform"
                  >
                    <Receipt className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Nouvelle transaction</div>
                      <div className="text-xs opacity-90">Créer une nouvelle transaction immobilière</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/dashboard/reseau/contacts">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 hover:scale-[1.02] transition-transform"
                  >
                    <Users className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Gérer les contacts</div>
                      <div className="text-xs opacity-90">Voir et gérer vos contacts</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/dashboard/modules/calendrier">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-3 hover:scale-[1.02] transition-transform"
                  >
                    <Calendar className="w-5 h-5" />
                    <div className="text-left">
                      <div className="font-semibold">Calendrier</div>
                      <div className="text-xs opacity-90">Voir vos rendez-vous et événements</div>
                    </div>
                  </Button>
                </Link>
              </Stack>
            </Card>
          </WidgetGrid.Item>

          {/* Statistiques financières */}
          <WidgetGrid.Item size="md">
            <Card variant="elevated" className="hover:shadow-xl transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-success-100 dark:bg-success-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-success-600 dark:text-success-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Résumé financier</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Vos commissions et revenus</p>
                </div>
              </div>
              <WidgetGrid columns={{ sm: 1 }} gap={4}>
                <WidgetGrid.Item size="md">
                  <MetricCard
                    title="Commissions conclues"
                    value={stats ? formatCurrency(stats.closed_commission) : '$0'}
                    subtitle="Commissions des transactions finalisées"
                    icon={<CheckCircle2 className="w-5 h-5" />}
                    trend="up"
                    variant="success"
                  />
                </WidgetGrid.Item>
              </WidgetGrid>
            </Card>
          </WidgetGrid.Item>
        </WidgetGrid>
      </MotionDiv>

      {/* Calendrier et Formulaires */}
      <MotionDiv variant="slideUp" delay={400}>
        <WidgetGrid columns={{ sm: 1, md: 2 }} gap={4}>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/modules/calendrier">
              <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Rendez-vous à venir</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {stats?.upcoming_events || 0} événement{stats?.upcoming_events !== 1 ? 's' : ''} prévu{stats?.upcoming_events !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </WidgetGrid.Item>
          <WidgetGrid.Item size="md">
            <Link href="/dashboard/modules/formulaire/oaciq">
              <Card variant="elevated" className="hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
                    <ClipboardList className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Formulaires OACIQ</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {stats?.total_forms || 0} formulaire{stats?.total_forms !== 1 ? 's' : ''} disponible{stats?.total_forms !== 1 ? 's' : ''}
                      {stats?.pending_submissions ? ` • ${stats.pending_submissions} en attente` : ''}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </WidgetGrid.Item>
        </WidgetGrid>
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
