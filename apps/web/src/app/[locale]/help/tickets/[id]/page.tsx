/**
 * Ticket Details Page
 *
 * Page for viewing a specific support ticket.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/store';
import { TicketDetails } from '@/components/help';
import type { SupportTicket, TicketMessage } from '@/components/help';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';
import { supportTicketsAPI } from '@/lib/api';
import { extractApiData } from '@/lib/api/utils';

export default function TicketDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('help.tickets');
  const { isAuthenticated } = useAuthStore();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    loadTicket();
  }, [ticketId, isAuthenticated, router]);

  const loadTicket = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const ticketIdNum = parseInt(ticketId, 10);
      if (isNaN(ticketIdNum)) {
        throw new Error('Invalid ticket ID');
      }

      // Load ticket details
      const ticketResponse = await supportTicketsAPI.get(ticketIdNum);
      // supportTicketsAPI returns ApiResponse<T>, extractApiData handles both formats
      const ticketData = extractApiData<SupportTicket>(
        ticketResponse as unknown as
          | SupportTicket
          | import('@modele/types').ApiResponse<SupportTicket>
      );

      // Load ticket messages
      const messagesResponse = await supportTicketsAPI.getMessages(ticketIdNum);
      // supportTicketsAPI returns ApiResponse<T>, extractApiData handles both formats
      const messagesData = extractApiData<TicketMessage[]>(
        messagesResponse as unknown as
          | TicketMessage[]
          | import('@modele/types').ApiResponse<TicketMessage[]>
      );

      setTicket({
        id: ticketData.id,
        subject: ticketData.subject,
        category: ticketData.category,
        status: ticketData.status,
        priority: ticketData.priority,
        created_at: ticketData.created_at,
        updated_at: ticketData.updated_at,
      });

      setMessages(Array.isArray(messagesData) ? messagesData : []);
    } catch (error: unknown) {
      logger.error(
        'Failed to load ticket',
        error instanceof Error ? error : new Error(String(error))
      );
      const appError = handleApiError(error);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load ticket. Please try again.'
      );
      setTicket(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId, t]);

  const handleReply = useCallback(
    async (message: string) => {
      try {
        const ticketIdNum = parseInt(ticketId, 10);
        if (isNaN(ticketIdNum)) {
          throw new Error('Invalid ticket ID');
        }

        await supportTicketsAPI.addMessage(ticketIdNum, message);
        logger.info('Reply sent successfully', { ticketId });

        // Reload ticket and messages
        await loadTicket();
      } catch (error: unknown) {
        logger.error(
          'Failed to send reply',
          error instanceof Error ? error : new Error(String(error))
        );
        const appError = handleApiError(error);
        setError(appError.message || 'Failed to send reply. Please try again.');
        throw error;
      }
    },
    [ticketId, loadTicket]
  );

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  if (!ticket) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <Alert variant="error">{t('errors.notFound') || 'Ticket not found'}</Alert>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={ticket.subject}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.help') || 'Help', href: '/help' },
            { label: t('breadcrumbs.tickets') || 'Tickets', href: '/help/tickets' },
            { label: `#${ticket.id}` },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <TicketDetails ticket={ticket} messages={messages} onReply={handleReply} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
