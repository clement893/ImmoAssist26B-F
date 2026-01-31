/**
 * Checkout Page
 * Booking form with summary - Generic placeholder
 */

'use client';

import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui';
import { useEffect } from 'react';

export default function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to book page as this feature is not available
    router.push('/book');
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Container>
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-muted-foreground">Redirection en cours...</p>
        </div>
      </Container>
    </div>
  );
}
