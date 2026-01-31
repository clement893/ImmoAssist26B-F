/** * Payment History Component * Displays transaction history and payment records */ 'use client';
import { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { Download, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';
export interface Payment extends Record<string, unknown> {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  paymentMethod: string;
  transactionId?: string;
}
export interface PaymentHistoryProps {
  payments: Payment[];
  onDownloadReceipt?: (payment: Payment) => void;
  className?: string;
}
export default function PaymentHistory({
  payments,
  onDownloadReceipt,
  className,
}: PaymentHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const filteredPayments = useMemo(() => {
    let filtered = payments;
    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      switch (dateRange) {
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          filterDate.setDate(now.getDate() - 90);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      filtered = filtered.filter((p) => new Date(p.date) >= filterDate);
    }
    return filtered;
  }, [payments, statusFilter, dateRange]);
  const getStatusBadge = useCallback((status: Payment['status']) => {
    const config = {
      completed: {
        variant: 'success' as const,
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Completed',
      },
      pending: {
        variant: 'warning' as const,
        icon: <Clock className="w-3 h-3" />,
        label: 'Pending',
      },
      failed: { variant: 'error' as const, icon: <XCircle className="w-3 h-3" />, label: 'Failed' },
      refunded: {
        variant: 'info' as const,
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Refunded',
      },
    };
    const { variant, icon, label } = config[status];
    return (
      <Badge variant={variant}>
        {' '}
        <span className="flex items-center gap-1">
          {' '}
          {icon} {label}{' '}
        </span>{' '}
      </Badge>
    );
  }, []);
  const columns = useMemo<Column<Payment>[]>(
    () => [
      {
        key: 'date',
        label: 'Date',
        sortable: true,
        render: (value) => (
          <div className="text-foreground">
            {' '}
            <div className="font-medium">
              {' '}
              {new Date(value as string).toLocaleDateString()}{' '}
            </div>{' '}
            <div className="text-xs text-muted-foreground">
              {' '}
              {new Date(value as string).toLocaleTimeString()}{' '}
            </div>{' '}
          </div>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        render: (value) => <span className="text-foreground">{value as string}</span>,
      },
      {
        key: 'amount',
        label: 'Amount',
        sortable: true,
        render: (_value, payment) => (
          <span
            className={clsx(
              'font-semibold',
              payment.status === 'refunded'
                ? 'text-error-600 dark:text-error-400'
                : 'text-foreground'
            )}
          >
            {' '}
            {payment.status === 'refunded' ? '-' : ''} {payment.currency}{' '}
            {Math.abs(payment.amount).toFixed(2)}{' '}
          </span>
        ),
      },
      {
        key: 'paymentMethod',
        label: 'Payment Method',
        render: (value) => <span className="text-foreground">{value as string}</span>,
      },
      {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (_, payment) => getStatusBadge(payment.status),
      },
      {
        key: 'actions',
        label: 'Actions',
        render: (_, payment) => (
          <div className="flex items-center gap-2">
            {' '}
            {payment.transactionId && (
              <span className="text-xs text-muted-foreground">
                {' '}
                {payment.transactionId.slice(0, 8)}...{' '}
              </span>
            )}{' '}
            {onDownloadReceipt && payment.status === 'completed' && (
              <button
                onClick={() => onDownloadReceipt(payment)}
                className="p-1 text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                title="Download Receipt"
              >
                {' '}
                <Download className="w-4 h-4" />{' '}
              </button>
            )}{' '}
          </div>
        ),
      },
    ],
    [getStatusBadge, onDownloadReceipt]
  );
  const totalAmount = filteredPayments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="mb-6">
        {' '}
        <div className="flex items-center justify-between mb-4">
          {' '}
          <h3 className="text-lg font-semibold text-foreground"> Payment History </h3>{' '}
          <div className="text-sm text-muted-foreground">
            {' '}
            Total:{' '}
            <span className="font-semibold text-foreground"> ${totalAmount.toFixed(2)} </span>{' '}
          </div>{' '}
        </div>{' '}
        {/* Filters */}{' '}
        <div className="flex items-center gap-4 flex-wrap">
          {' '}
          <div className="flex items-center gap-2">
            {' '}
            <Filter className="w-4 h-4 text-muted-foreground" />{' '}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={clsx(
                'px-3 py-2 border rounded-lg text-sm',
                'bg-background',
                'text-foreground',
                'border-border',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
              )}
            >
              {' '}
              <option value="all">All Status</option> <option value="completed">Completed</option>{' '}
              <option value="pending">Pending</option> <option value="failed">Failed</option>{' '}
              <option value="refunded">Refunded</option>{' '}
            </select>{' '}
          </div>{' '}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={clsx(
              'px-3 py-2 border rounded-lg text-sm',
              'bg-background',
              'text-foreground',
              'border-border',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400'
            )}
          >
            {' '}
            <option value="all">All Time</option> <option value="30days">Last 30 Days</option>{' '}
            <option value="90days">Last 90 Days</option>{' '}
            <option value="year">Last Year</option>{' '}
          </select>{' '}
        </div>{' '}
      </div>{' '}
      <DataTable<Payment>
        data={filteredPayments}
        columns={columns}
        pageSize={10}
        emptyMessage="No payment history found"
      />{' '}
    </Card>
  );
}
