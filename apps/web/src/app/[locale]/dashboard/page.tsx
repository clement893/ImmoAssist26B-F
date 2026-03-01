'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useQuery } from '@tanstack/react-query';
import { Card, Button, LoadingSkeleton } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { getBrokerDashboardStats } from '@/lib/api/dashboard';
import {
  Receipt,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  BarChart3,
} from 'lucide-react';

const DASHBOARD_STATS_STALE_MS = 2 * 60 * 1000; // 2 minutes

function DashboardContent() {
  const {
    data: stats,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: getBrokerDashboardStats,
    staleTime: DASHBOARD_STATS_STALE_MS,
    refetchOnWindowFocus: false,
  });
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Erreur lors du chargement des statistiques') : null;

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
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="space-y-8">
            <div>
              <LoadingSkeleton variant="custom" className="h-12 w-80 mb-3" />
              <LoadingSkeleton variant="custom" className="h-6 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <LoadingSkeleton variant="card" className="h-40" />
              <LoadingSkeleton variant="card" className="h-40" />
              <LoadingSkeleton variant="card" className="h-40" />
              <LoadingSkeleton variant="card" className="h-40" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingSkeleton variant="card" className="h-64" />
              <LoadingSkeleton variant="card" className="h-64" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de votre activité</p>
          </div>
          <Link href="/dashboard/transactions">
            <Button variant="gradient" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle transaction
            </Button>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <Card variant="default" className="border-red-200 bg-red-50 rounded-3xl">
            <div className="flex items-center gap-4 p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </Card>
        )}

        {/* Stats Cards - Principales métriques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/dashboard/transactions" className="block">
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
              title="En attente"
              value={stats?.conditional_transactions.toString() || '0'}
              icon={<AlertCircle className="w-5 h-5" />}
              variant="warning"
              className="h-full"
            />
          </Link>
          <StatsCard
            title="Commissions totales"
            value={stats ? formatCurrency(stats.total_commission) : '$0'}
            icon={<DollarSign className="w-5 h-5" />}
            variant="primary"
            className="h-full"
          />
          <Link href="/dashboard/reseau/contacts" className="block">
            <StatsCard
              title="Contacts"
              value={stats?.total_contacts.toString() || '0'}
              icon={<Users className="w-5 h-5" />}
              variant="default"
              className="h-full"
            />
          </Link>
        </div>

        {/* Widget EA */}
        <Card variant="default" className="rounded-3xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Évaluation d'Actif (EA)</h2>
                  <p className="text-sm text-gray-500">Vue d'ensemble de vos évaluations</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 uppercase">Évaluations actives</span>
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">{stats?.active_transactions || 0}</p>
                <p className="text-xs text-gray-500 mt-1">En cours d'évaluation</p>
              </div>
              <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-green-600 uppercase">Valeur totale</span>
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats ? formatCurrency(stats.total_commission || 0) : '$0'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Valeur estimée</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-purple-600 uppercase">Taux de conversion</span>
                  <TrendingUp className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-semibold text-gray-900">85%</p>
                <p className="text-xs text-gray-500 mt-1">Évaluations complétées</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Actions rapides */}
        <Card variant="default" className="rounded-3xl">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/transactions">
                <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <Receipt className="w-6 h-6 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Transactions</h3>
                  <p className="text-sm text-gray-500">Gérer vos transactions</p>
                </div>
              </Link>
              <Link href="/dashboard/reseau/contacts">
                <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <Users className="w-6 h-6 text-green-600 mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Contacts</h3>
                  <p className="text-sm text-gray-500">Voir vos contacts</p>
                </div>
              </Link>
              <Link href="/dashboard/modules/calendrier">
                <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Calendrier</h3>
                  <p className="text-sm text-gray-500">Vos rendez-vous</p>
                </div>
              </Link>
              <Link href="/dashboard/modules/formulaire/oaciq">
                <div className="p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <FileText className="w-6 h-6 text-orange-600 mb-2" />
                  <h3 className="font-medium text-gray-900 mb-1">Formulaires</h3>
                  <p className="text-sm text-gray-500">Formulaires OACIQ</p>
                </div>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}
