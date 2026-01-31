/** * Support Tickets Component * * Displays list of user support tickets. * * @component */ 'use client';
import { Card, DataTable, Button, Badge } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Plus, Eye, MessageSquare } from 'lucide-react';
import { Link } from '@/i18n/routing';
export interface SupportTicket extends Record<string, unknown> {
  id: number;
  subject: string;
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  last_reply_at?: string;
}
export interface SupportTicketsProps {
  tickets?: SupportTicket[];
  onCreateTicket?: () => void;
  className?: string;
}
/** * Support Tickets Component * * Displays support tickets in a DataTable. */ export default function SupportTickets({
  tickets = [],
  onCreateTicket,
  className,
}: SupportTicketsProps) {
  const columns: Column<SupportTicket>[] = [
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
      render: (_value: unknown, ticket: SupportTicket) => (
        <div className="flex items-center gap-2">
          {' '}
          <MessageSquare className="w-4 h-4 text-muted-foreground" />{' '}
          <span className="font-medium text-foreground">{ticket.subject}</span>{' '}
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      render: (_value: unknown, ticket: SupportTicket) => (
        <Badge variant="default">{ticket.category}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_value: unknown, ticket: SupportTicket) => {
        const statusColors: Record<
          SupportTicket['status'],
          'default' | 'success' | 'warning' | 'error'
        > = { open: 'default', in_progress: 'warning', resolved: 'success', closed: 'default' };
        return (
          <Badge variant={statusColors[ticket.status]}> {ticket.status.replace('_', '')} </Badge>
        );
      },
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (_value: unknown, ticket: SupportTicket) => {
        const priorityColors: Record<SupportTicket['priority'], 'default' | 'warning' | 'error'> = {
          low: 'default',
          medium: 'default',
          high: 'warning',
          urgent: 'error',
        };
        return <Badge variant={priorityColors[ticket.priority]}> {ticket.priority} </Badge>;
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (_value: unknown, ticket: SupportTicket) => (
        <span className="text-sm text-muted-foreground">
          {' '}
          {new Date(ticket.created_at).toLocaleDateString()}{' '}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, ticket: SupportTicket) => (
        <Link href={`/help/tickets/${ticket.id}`}>
          {' '}
          <Button variant="ghost" size="sm" title="View">
            {' '}
            <Eye className="w-4 h-4" />{' '}
          </Button>{' '}
        </Link>
      ),
    },
  ];
  return (
    <div className={className}>
      {' '}
      <Card title="Support Tickets">
        {' '}
        {onCreateTicket && (
          <div className="mb-4 flex justify-end">
            {' '}
            <Button onClick={onCreateTicket} variant="primary">
              {' '}
              <Plus className="w-4 h-4 mr-2" /> New Ticket{' '}
            </Button>{' '}
          </div>
        )}{' '}
        <DataTable
          data={tickets}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search tickets..."
        />{' '}
      </Card>{' '}
    </div>
  );
}
