/**
 * useEmail Hook
 *
 * React hook for sending transactional emails via SendGrid.
 * Provides convenient methods for all email types with loading states
 * and toast notifications.
 *
 * @example
 * ```typescript
 * import { useEmail } from '@/hooks/useEmail';
 *
 * function MyComponent() {
 *   const { sendWelcomeEmail, loading } = useEmail();
 *
 *   const handleWelcome = async () => {
 *     await sendWelcomeEmail('user@example.com', 'John Doe');
 *   };
 *
 *   return (
 *     <button onClick={handleWelcome} disabled={loading}>
 *       Send Welcome Email
 *     </button>
 *   );
 * }
 * ```
 *
 * @returns Object with email sending methods and loading state
 */

import { useState } from 'react';
import { emailAPI, type EmailResponse } from '@/lib/email/client';
import { useToast } from '@/components/ui';
import type { ApiResponse } from '@modele/types';

export function useEmail() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const sendEmail = async (
    toEmail: string,
    subject: string,
    htmlContent: string,
    textContent?: string
  ): Promise<EmailResponse | null> => {
    setLoading(true);
    try {
      const response: ApiResponse<EmailResponse> = await emailAPI.send({
        to_email: toEmail,
        subject,
        html_content: htmlContent,
        text_content: textContent,
      });
      showToast({
        message: 'Email envoyé avec succès',
        type: 'success',
      });
      return response.data ?? null;
    } catch (error) {
      showToast({
        message: "Erreur lors de l'envoi de l'email",
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendWelcomeEmail = async (
    toEmail: string,
    name?: string
  ): Promise<EmailResponse | null> => {
    setLoading(true);
    try {
      const response: ApiResponse<EmailResponse> = await emailAPI.sendWelcome(toEmail, name);
      showToast({
        message: 'Email de bienvenue envoyé',
        type: 'success',
      });
      return response.data ?? null;
    } catch (error) {
      showToast({
        message: "Erreur lors de l'envoi de l'email de bienvenue",
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendInvoiceEmail = async (data: {
    to_email: string;
    name: string;
    invoice_number: string;
    invoice_date: string;
    amount: number;
    currency?: string;
    invoice_url?: string;
    items?: Array<{ description: string; amount: number }>;
  }): Promise<EmailResponse | null> => {
    setLoading(true);
    try {
      const response: ApiResponse<EmailResponse> = await emailAPI.sendInvoice(data);
      showToast({
        message: 'Facture envoyée par email',
        type: 'success',
      });
      return response.data ?? null;
    } catch (error) {
      showToast({
        message: "Erreur lors de l'envoi de la facture",
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendSubscriptionCreatedEmail = async (data: {
    to_email: string;
    name: string;
    plan_name: string;
    amount: number;
    currency?: string;
  }): Promise<EmailResponse | null> => {
    setLoading(true);
    try {
      const response: ApiResponse<EmailResponse> = await emailAPI.sendSubscriptionCreated(data);
      showToast({
        message: "Email d'abonnement envoyé",
        type: 'success',
      });
      return response.data ?? null;
    } catch (error) {
      showToast({
        message: "Erreur lors de l'envoi de l'email d'abonnement",
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const sendTrialEndingEmail = async (data: {
    to_email: string;
    name: string;
    days_remaining: number;
    upgrade_url?: string;
  }): Promise<EmailResponse | null> => {
    setLoading(true);
    try {
      const response: ApiResponse<EmailResponse> = await emailAPI.sendTrialEnding(data);
      showToast({
        message: "Email d'essai envoyé",
        type: 'success',
      });
      return response.data ?? null;
    } catch (error) {
      showToast({
        message: "Erreur lors de l'envoi de l'email",
        type: 'error',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    sendEmail,
    sendWelcomeEmail,
    sendInvoiceEmail,
    sendSubscriptionCreatedEmail,
    sendTrialEndingEmail,
  };
}
