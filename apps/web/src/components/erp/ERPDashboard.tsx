/** * ERP Dashboard Component * * Main dashboard for ERP portal showing comprehensive statistics and overview. * * @module ERPDashboard */ 'use client';
import { memo } from 'react';
import { ERPDashboardStats } from '@/lib/api/erp-portal';
import { Card, StatsCard } from '@/components/ui';
import { useApi } from '@/hooks/useApi';
/** * ERP Dashboard Component * * Displays ERP portal dashboard with: * - Order statistics * - Invoice statistics * - Client statistics * - Inventory statistics * - Revenue metrics * - Department-specific stats (if applicable) * * @example * ```tsx * <ERPDashboard /> * ``` */ export const ERPDashboard =
  memo(function ERPDashboard() {
    const {
      data: stats,
      isLoading,
      error,
    } = useApi<ERPDashboardStats>({ url: '/v1/erp/dashboard/stats' });
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {' '}
          {[...Array(12)].map((_, i) => (
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
            title="Total Clients"
            value={stats.total_clients.toString()}
            className="bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-800"
          />{' '}
        </div>{' '}
        {/* Financial Overview */}{' '}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {' '}
          <Card title="Revenue Overview">
            {' '}
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Total Revenue</p>{' '}
                <p className="text-2xl font-bold text-foreground">
                  {' '}
                  ${parseFloat(stats.total_revenue).toFixed(2)}{' '}
                </p>{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Pending Revenue</p>{' '}
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                  {' '}
                  ${parseFloat(stats.pending_revenue).toFixed(2)}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
          <Card title="Invoices & Clients">
            {' '}
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Paid Invoices</p>{' '}
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                  {' '}
                  {stats.paid_invoices} / {stats.total_invoices}{' '}
                </p>{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Active Clients</p>{' '}
                <p className="text-2xl font-bold text-foreground">
                  {' '}
                  {stats.active_clients} / {stats.total_clients}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
        </div>{' '}
        {/* Inventory Stats */}{' '}
        {(stats.total_products > 0 || stats.low_stock_products > 0) && (
          <Card title="Inventory Status">
            {' '}
            <div className="grid grid-cols-2 gap-4">
              {' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Total Products</p>{' '}
                <p className="text-2xl font-bold text-foreground"> {stats.total_products} </p>{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-sm text-muted-foreground">Low Stock Items</p>{' '}
                <p
                  className={`text-2xl font-bold ${stats.low_stock_products > 0 ? 'text-error-600 dark:text-error-400' : 'text-success-600 dark:text-success-400'}`}
                >
                  {' '}
                  {stats.low_stock_products}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>
        )}{' '}
      </div>
    );
  });
