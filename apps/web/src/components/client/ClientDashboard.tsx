/** * Client Dashboard Component * * Main dashboard for client portal showing statistics and overview. * * @module ClientDashboard */ 'use client';
import { memo } from 'react';
import { ClientDashboardStats } from '@/lib/api/client-portal';
import { Card, StatsCard } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
/** * Client Dashboard Component * * Displays client portal dashboard with: * - Order statistics * - Invoice statistics * - Project statistics * - Support ticket statistics * - Financial overview * * @example * ```tsx * <ClientDashboard /> * ``` */ export const ClientDashboard =
  memo(function ClientDashboard() {
    const {
      data: stats,
      isLoading,
      error,
    } = useApi<ClientDashboardStats>({ url: '/v1/client/dashboard/stats' });
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {' '}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}{' '}
        </div>
      );
    }
    if (error) {
      return (
        <Card title="Error">
          {' '}
          <p className="text-error-600 dark:text-error-400">
            {' '}
            Failed to load dashboard statistics. Please try again later.{' '}
          </p>{' '}
        </Card>
      );
    }
    if (!stats) {
      return null;
    }
    return (
      <div className="space-y-6">
        {' '}
        {/* Overview Stats */}{' '}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {' '}
          <StatsCard
            title="Total Orders"
            value={stats.total_orders.toString()}
            className="bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800"
          />{' '}
          <StatsCard
            title="Pending Orders"
            value={stats.pending_orders.toString()}
            className="bg-warning-100 dark:bg-warning-900/40 border-warning-200 dark:border-warning-800"
          />{' '}
          <StatsCard
            title="Completed Orders"
            value={stats.completed_orders.toString()}
            className="bg-success-100 dark:bg-success-900/40 border-success-200 dark:border-success-800"
          />{' '}
          <StatsCard
            title="Open Tickets"
            value={stats.open_tickets.toString()}
            className="bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800"
          />{' '}
        </div>{' '}
        {/* Financial Overview */}{' '}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {' '}
          <Card title="Financial Overview">
            {' '}
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Total Spent</p>{' '}
                <p className="text-2xl font-bold text-foreground">
                  {' '}
                  ${parseFloat(stats.total_spent).toFixed(2)}{' '}
                </p>{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Pending Amount</p>{' '}
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                  {' '}
                  ${parseFloat(stats.pending_amount).toFixed(2)}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
          <Card title="Projects & Invoices">
            {' '}
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Active Projects</p>{' '}
                <p className="text-2xl font-bold text-foreground">
                  {' '}
                  {stats.active_projects} / {stats.total_projects}{' '}
                </p>{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Paid Invoices</p>{' '}
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {' '}
                  {stats.paid_invoices} / {stats.total_invoices}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
        </div>{' '}
      </div>
    );
  });
