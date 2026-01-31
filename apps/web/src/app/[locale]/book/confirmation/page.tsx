/**
 * Booking Confirmation Page
 * Displays confirmation after successful booking - Generic placeholder
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

export default function ConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingReference = searchParams.get('bookingReference');

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20 md:py-32">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-success-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-success-600" aria-hidden="true" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Réservation confirmée
          </h1>
          {bookingReference && (
            <p className="text-lg font-semibold text-muted-foreground mb-8">
              Référence : {bookingReference}
            </p>
          )}
          <p className="text-muted-foreground mb-8">
            Votre réservation a été créée avec succès. Vous recevrez un email de confirmation sous
            peu.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </Container>
    </div>
  );
}
