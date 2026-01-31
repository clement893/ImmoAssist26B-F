/**
 * Client Portal - Support Tickets Page
 *
 * Displays list of client support tickets and allows creating new tickets.
 *
 * @module ClientTicketsPage
 */

'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { useApi } from '@/hooks/useApi';
import {
  clientPortalAPI,
  ClientTicketListResponse,
  ClientTicketCreate,
} from '@/lib/api/client-portal';
import { DataTable, Button, Modal } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import type { Column } from '@/components/ui';

/**
 * Client Support Tickets Page
 *
 * Shows paginated list of tickets with:
 * - Ticket subject
 * - Status and priority
 * - Creation date
 * - Last reply date
 *
 * @requires CLIENT_VIEW_TICKETS permission
 */
function ClientTicketsContent() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const pageSize = 10;

  const { data, isLoading, error, refetch } = useApi<ClientTicketListResponse>({
    url: '/v1/client/tickets',
    params: {
      skip: 0,
      limit: pageSize,
    },
  });

  const columns: Column<ClientTicketListResponse['items'][0]>[] = [
    {
      key: 'subject',
      label: 'Subject',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === 'open'
              ? 'bg-success-100 text-success-800'
              : value === 'resolved'
                ? 'bg-info-100 text-info-800'
                : 'bg-muted text-foreground'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            value === 'urgent'
              ? 'bg-error-100 text-error-800'
              : value === 'high'
                ? 'bg-warning-100 text-warning-800'
                : 'bg-muted text-foreground'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
  ];

  const handleCreateTicket = async (ticketData: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
  }) => {
    try {
      await clientPortalAPI.createTicket(ticketData as ClientTicketCreate);
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      logger.error('', 'Failed to create ticket:', error);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg">
        <p className="text-error-600 dark:text-error-400">
          Failed to load tickets. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Support Tickets</h1>
          <p className="text-muted-foreground">Get help from our support team</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Ticket</Button>
      </div>

      <DataTable
        data={(data?.items || []) as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        loading={isLoading}
        pageSize={pageSize}
        emptyMessage="No tickets found"
      />

      <Modal
        isOpen={showCreateModal}
        title="Create Support Ticket"
        onClose={() => setShowCreateModal(false)}
      >
        <CreateTicketForm
          onSubmit={handleCreateTicket}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}

function CreateTicketForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
  }) => void;
  onCancel: () => void;
}) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState('general');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ subject, description, priority, category });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg"
          rows={4}
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'urgent')}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            <option value="general">General</option>
            <option value="technical">Technical</option>
            <option value="billing">Billing</option>
            <option value="feature">Feature Request</option>
            <option value="bug">Bug Report</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Ticket</Button>
      </div>
    </form>
  );
}

export default function ClientTicketsPage() {
  return (
    <ProtectedRoute>
      <ClientTicketsContent />
    </ProtectedRoute>
  );
}
