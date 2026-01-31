import { Card, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
interface Payment extends Record<string, unknown> {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
  invoice_url?: string;
}
interface PaymentHistoryProps {
  payments: Payment[];
}
export default function PaymentHistory({ payments }: PaymentHistoryProps) {
  const columns: Column<Payment>[] = [
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-foreground">
          {' '}
          {new Date(String(value)).toLocaleDateString('fr-FR')}{' '}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value, _row) => (
        <span className="text-sm font-medium text-foreground"> {String(value)}€ </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => {
        const status = String(value);
        const variant = status === 'paid' ? 'success' : status === 'failed' ? 'error' : 'default';
        const label = status === 'paid' ? 'Paid' : status === 'pending' ? 'Pending' : 'Failed';
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'invoice_url',
      label: 'Actions',
      sortable: false,
      render: (value, _row) => (
        <div>
          {' '}
          {value ? (
            <a
              href={String(value)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
            >
              {' '}
              Download Invoice{' '}
            </a>
          ) : null}{' '}
        </div>
      ),
    },
  ];
  return (
    <Card>
      {' '}
      <div className="p-6">
        {' '}
        <h2 className="text-2xl font-bold text-foreground mb-6"> Payment History </h2>{' '}
        {payments.length === 0 ? (
          <p className="text-muted-foreground">No payments yet</p>
        ) : (
          <DataTable
            data={payments}
            columns={columns}
            pageSize={10}
            searchable={true}
            searchPlaceholder="Search payments..."
            emptyMessage="No payments found"
          />
        )}{' '}
      </div>{' '}
    </Card>
  );
}
