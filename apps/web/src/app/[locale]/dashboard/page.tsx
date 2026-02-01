'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useEffect } from 'react';
import { Card, Button, LoadingSkeleton } from '@/components/ui';
import { StatsCard } from '@/components/ui';
import { Link } from '@/i18n/routing';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { getBrokerDashboardStats, BrokerDashboardStats } from '@/lib/api/dashboard';
import {
  Receipt,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
} from 'lucide-react';

function DashboardContent() {
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
      <div className="min-h-screen bg-gray-100 p-8">
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
    <div className="min-h-screen bg-gray-100 p-8">
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
