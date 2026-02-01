'use client';

import { useState } from 'react';
import {
  Users,
  Building2,
  Receipt,
  TrendingUp,
  Calendar as CalendarIcon,
  Video,
  Clock,
  Plus,
} from 'lucide-react';

export default function DemoDashboard() {
  const [currentDate] = useState(new Date());

  // Mock data
  const stats = [
    {
      title: 'Total Transactions',
      value: '24',
      change: '+12%',
      icon: Receipt,
      color: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Active Clients',
      value: '156',
      change: '+8%',
      icon: Users,
      color: 'bg-green-500',
      lightBg: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Properties Listed',
      value: '42',
      change: '+5%',
      icon: Building2,
      color: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'Revenue',
      value: '$125K',
      change: '+18%',
      icon: TrendingUp,
      color: 'bg-amber-500',
      lightBg: 'bg-amber-50',
      textColor: 'text-amber-700',
    },
  ];

  const todayAgenda = [
    {
      title: 'Morning stand-up',
      time: '9:00 - 9:15',
      status: 'upcoming',
      color: 'bg-blue-500',
    },
    {
      title: 'Property viewing - 123 Main St',
      time: '10:00 - 10:30',
      status: 'upcoming',
      color: 'bg-green-500',
    },
    {
      title: 'Client meeting - Smith family',
      time: '13:00 - 14:45',
      status: 'upcoming',
      color: 'bg-purple-500',
    },
    {
      title: 'Contract signing',
      time: '15:00 - 15:30',
      status: 'upcoming',
      color: 'bg-amber-500',
    },
  ];

  const invitations = [
    {
      name: 'Sarah Johnson',
      event: 'Q4 Planning Meeting',
      avatar: 'SJ',
      color: 'bg-pink-500',
    },
    {
      name: 'Michael Chen',
      event: 'Property Showcase',
      avatar: 'MC',
      color: 'bg-blue-500',
    },
    {
      name: 'Emma Wilson',
      event: 'Team Brainstorming',
      avatar: 'EW',
      color: 'bg-green-500',
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calendar days
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const days = getDaysInMonth();
  const today = currentDate.getDate();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Good morning, John!</h1>
        <p className="mt-2 text-lg text-slate-600">{formatDate(currentDate)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-slate-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="mt-2 flex items-center text-sm font-medium text-green-600">
                    <TrendingUp className="mr-1 h-4 w-4" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`rounded-xl ${stat.lightBg} p-3`}>
                  <Icon className={`h-6 w-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column - Agenda & Calendar */}
        <div className="space-y-6 lg:col-span-2">
          {/* Today's Agenda */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">Your agenda today</h2>
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                + Add Event
              </button>
            </div>
            <div className="space-y-4">
              {todayAgenda.map((event, index) => (
                <div
                  key={index}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div className={`h-12 w-1 rounded-full ${event.color}`} />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{event.title}</h3>
                    <p className="mt-1 flex items-center text-sm text-slate-600">
                      <Clock className="mr-1.5 h-4 w-4" />
                      {event.time}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                      Reschedule
                    </button>
                    <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                      Change attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <div key={index} className="text-center text-sm font-semibold text-slate-600">
                  {day}
                </div>
              ))}
              {days.map((day, index) => (
                <div
                  key={index}
                  className={`flex h-12 items-center justify-center rounded-lg text-sm transition-colors ${
                    day === null
                      ? ''
                      : day === today
                        ? 'bg-indigo-600 font-bold text-white'
                        : day === 7
                          ? 'bg-indigo-50 font-semibold text-indigo-700 ring-2 ring-indigo-600'
                          : 'cursor-pointer font-medium text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Invitations */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 text-white shadow-lg">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Quick Actions</h2>
              <p className="mt-2 text-sm text-indigo-100">Start your day efficiently</p>
            </div>
            <div className="space-y-3">
              <button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="rounded-lg bg-white/20 p-2">
                  <Video className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Start a meeting</div>
                  <div className="text-xs text-indigo-100">Begin instant video call</div>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="rounded-lg bg-white/20 p-2">
                  <Plus className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Join a meeting</div>
                  <div className="text-xs text-indigo-100">Enter meeting code</div>
                </div>
              </button>
              <button className="flex w-full items-center gap-3 rounded-xl bg-white/10 p-4 text-left backdrop-blur-sm transition-all hover:bg-white/20">
                <div className="rounded-lg bg-white/20 p-2">
                  <CalendarIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">Schedule a meeting</div>
                  <div className="text-xs text-indigo-100">Plan for later</div>
                </div>
              </button>
            </div>
          </div>

          {/* Invitations */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Invitations</h2>
            <div className="space-y-4">
              {invitations.map((invitation, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${invitation.color} text-sm font-bold text-white`}>
                    {invitation.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{invitation.name}</p>
                    <p className="text-xs text-slate-600">{invitation.event}</p>
                  </div>
                  <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <h2 className="mb-6 text-xl font-bold text-slate-900">Insights</h2>
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Meetings hosted this week</p>
                  <p className="text-3xl font-bold text-indigo-600">8</p>
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">Meetings attended this week</p>
                  <p className="text-3xl font-bold text-blue-600">16</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
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
  ArrowRight,
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
                  icon={<TrendingUp className="w-5 h-5" />}
                  variant="warning"
                  className="h-full"
                />
              </Link>
              <Link href="/dashboard/transactions?status=Conclue" className="block">
                <StatsCard
                  title="Transactions conclues"
                  value={stats?.closed_transactions.toString() || '0'}
                  icon={<Receipt className="w-5 h-5" />}
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
                <div className="p-4 bg-primary-600 dark:bg-primary-500 rounded-xl shadow-subtle-sm">
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
                <div className="p-4 bg-success-100 dark:bg-success-900/30 rounded-xl shadow-subtle-sm">
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
                    <Receipt className="w-5 h-5 text-success-600 dark:text-success-400" />
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
              <Card variant="elevated" className="h-full hover:shadow-standard-xl transition-modern">
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
              <Card variant="elevated" className="h-full hover:shadow-standard-xl transition-modern">
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
              <div className="p-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl shadow-subtle-sm">
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
    </div>
  );
}
