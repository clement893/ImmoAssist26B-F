'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { Card, Button, LoadingSkeleton, Grid, Container } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { PageHeader } from '@/components/layout';
import { Link } from '@/i18n/routing';
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
  ArrowRight,
  Plus,
} from 'lucide-react';

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
      <Container className="py-8">
        <div className="space-y-8">
          <div>
            <LoadingSkeleton variant="custom" className="h-12 w-80 mb-3" />
            <LoadingSkeleton variant="custom" className="h-6 w-96" />
          </div>
          <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="spacious">
            <LoadingSkeleton variant="card" className="h-40" />
            <LoadingSkeleton variant="card" className="h-40" />
            <LoadingSkeleton variant="card" className="h-40" />
            <LoadingSkeleton variant="card" className="h-40" />
          </Grid>
          <LoadingSkeleton variant="card" count={2} className="h-64" />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <div className="space-y-8">
        {/* Welcome Header */}
        <MotionDiv variant="fade" delay={100}>
          <PageHeader
            title={`Bienvenue, ${user?.name || 'Courtier'} !`}
            description="Vue d'ensemble de votre activité immobilière"
            breadcrumbs={[{ label: 'Accueil', href: '/' }, { label: 'Dashboard' }]}
          />
        </MotionDiv>

        {/* Error Alert */}
        {error && (
          <MotionDiv variant="slideUp" delay={150}>
            <Card variant="elevated" className="border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-950/20" leftBorder="warning">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0" />
                <p className="text-sm text-warning-800 dark:text-warning-200">{error}</p>
              </div>
            </Card>
          </MotionDiv>
        )}

        {/* Statistiques principales - Transactions */}
        <MotionDiv variant="slideUp" delay={200}>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Statistiques des transactions</h2>
            <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="spacious">
              <Link href="/dashboard/transactions" className="block">
                <StatsCard
                  title="Transactions totales"
                  value={stats?.total_transactions.toString() || '0'}
                  icon={<Receipt className="w-5 h-5" />}
                  variant="primary"
                  className="h-full"
                />
              </Link>
              <Link href="/dashboard/transactions?status=En cours" className="block">
                <StatsCard
                  title="Transactions actives"
                  value={stats?.active_transactions.toString() || '0'}
                  icon={<TrendingUp className="w-5 h-5" />}
                  variant="success"
                  className="h-full"
                />
              </Link>
              <Link href="/dashboard/transactions?status=Conditionnelle" className="block">
                <StatsCard
                  title="Transactions conditionnelles"
                  value={stats?.conditional_transactions.toString() || '0'}
                  icon={<AlertCircle className="w-5 h-5" />}
                  variant="warning"
                  className="h-full"
                />
              </Link>
              <Link href="/dashboard/transactions?status=Conclue" className="block">
                <StatsCard
                  title="Transactions conclues"
                  value={stats?.closed_transactions.toString() || '0'}
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  variant="default"
                  className="h-full"
                />
              </Link>
            </Grid>
          </div>
        </MotionDiv>

        {/* Statistiques secondaires - Réseau et Finances */}
        <MotionDiv variant="slideUp" delay={250}>
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Réseau et finances</h2>
            <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="spacious">
              <Link href="/dashboard/reseau/contacts" className="block">
                <StatsCard
                  title="Contacts"
                  value={stats?.total_contacts.toString() || '0'}
                  icon={<Users className="w-5 h-5" />}
                  variant="default"
                  className="h-full"
                />
              </Link>
              <Link href="/dashboard/reseau/entreprises" className="block">
                <StatsCard
                  title="Entreprises"
                  value={stats?.total_companies.toString() || '0'}
                  icon={<Building2 className="w-5 h-5" />}
                  variant="default"
                  className="h-full"
                />
              </Link>
              <StatsCard
                title="Commissions totales"
                value={stats ? formatCurrency(stats.total_commission) : '$0'}
                icon={<DollarSign className="w-5 h-5" />}
                variant="success"
                className="h-full"
              />
              <StatsCard
                title="Commissions en attente"
                value={stats ? formatCurrency(stats.pending_commission) : '$0'}
                icon={<TrendingUp className="w-5 h-5" />}
                variant="warning"
                className="h-full"
              />
            </Grid>
          </div>
        </MotionDiv>

        {/* Actions rapides et Informations */}
        <MotionDiv variant="slideUp" delay={300}>
          <Grid columns={{ mobile: 1, tablet: 2 }} gap="spacious">
            {/* Actions rapides */}
            <Card variant="gradient" leftBorder="primary" className="h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-primary-600 dark:bg-primary-500 rounded-xl shadow-sm">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Actions rapides</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Accès rapide aux fonctionnalités principales</p>
                </div>
              </div>
              <div className="space-y-3">
                <Link href="/dashboard/transactions">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <Receipt className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-semibold">Nouvelle transaction</div>
                      <div className="text-xs opacity-90 font-normal">Créer une nouvelle transaction immobilière</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/dashboard/reseau/contacts">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <Users className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-semibold">Gérer les contacts</div>
                      <div className="text-xs opacity-90 font-normal">Voir et gérer vos contacts</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/dashboard/modules/calendrier">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <Calendar className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-semibold">Calendrier</div>
                      <div className="text-xs opacity-90 font-normal">Voir vos rendez-vous et événements</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/dashboard/modules/formulaire/oaciq">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <div className="text-left flex-1">
                      <div className="font-semibold">Formulaires OACIQ</div>
                      <div className="text-xs opacity-90 font-normal">Accéder aux formulaires officiels</div>
                    </div>
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Résumé financier */}
            <Card variant="elevated" className="h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-success-100 dark:bg-success-900/30 rounded-xl shadow-sm">
                  <DollarSign className="w-6 h-6 text-success-600 dark:text-success-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Résumé financier</h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Vos commissions et revenus</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-6 bg-success-50 dark:bg-success-950/20 rounded-xl border-2 border-success-200 dark:border-success-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-success-700 dark:text-success-300">Commissions conclues</span>
                    <CheckCircle2 className="w-5 h-5 text-success-600 dark:text-success-400" />
                  </div>
                  <p className="text-3xl font-bold text-success-900 dark:text-success-100">
                    {stats ? formatCurrency(stats.closed_commission) : '$0'}
                  </p>
                  <p className="text-xs text-success-600 dark:text-success-400 mt-2">
                    Commissions des transactions finalisées
                  </p>
                </div>
                <div className="p-6 bg-warning-50 dark:bg-warning-950/20 rounded-xl border-2 border-warning-200 dark:border-warning-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-warning-700 dark:text-warning-300">Commissions en attente</span>
                    <TrendingUp className="w-5 h-5 text-warning-600 dark:text-warning-400" />
                  </div>
                  <p className="text-3xl font-bold text-warning-900 dark:text-warning-100">
                    {stats ? formatCurrency(stats.pending_commission) : '$0'}
                  </p>
                  <p className="text-xs text-warning-600 dark:text-warning-400 mt-2">
                    Commissions en cours de traitement
                  </p>
                </div>
              </div>
            </Card>
          </Grid>
        </MotionDiv>

        {/* Calendrier et Formulaires - Section compacte */}
        <MotionDiv variant="slideUp" delay={350}>
          <Grid columns={{ mobile: 1, tablet: 2 }} gap="spacious">
            <Link href="/dashboard/modules/calendrier" className="block">
              <Card variant="elevated" className="h-full hover:shadow-xl transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                    <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Rendez-vous à venir</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {stats?.upcoming_events || 0} événement{stats?.upcoming_events !== 1 ? 's' : ''} prévu{stats?.upcoming_events !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400" />
                </div>
              </Card>
            </Link>
            <Link href="/dashboard/modules/formulaire/oaciq" className="block">
              <Card variant="elevated" className="h-full hover:shadow-xl transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-secondary-100 dark:bg-secondary-900/30 rounded-xl">
                    <ClipboardList className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Formulaires OACIQ</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {stats?.total_forms || 0} formulaire{stats?.total_forms !== 1 ? 's' : ''} disponible{stats?.total_forms !== 1 ? 's' : ''}
                      {stats?.pending_submissions ? ` • ${stats.pending_submissions} en attente` : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400" />
                </div>
              </Card>
            </Link>
          </Grid>
        </MotionDiv>

        {/* Léa AI Assistant - Section dédiée */}
        <MotionDiv variant="slideUp" delay={400}>
          <Card className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-gray-800" leftBorder="purple">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold bg-gradient-to-r from-green-400 via-blue-400 to-green-400 bg-clip-text text-transparent">
                  Léa - Assistante AI
                </h3>
                <p className="text-sm text-gray-400">Votre assistante intelligente spécialisée dans l'immobilier</p>
              </div>
            </div>
            <div className="h-[500px] rounded-xl overflow-hidden">
              <LeaChat />
            </div>
          </Card>
        </MotionDiv>
      </div>
    </Container>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
