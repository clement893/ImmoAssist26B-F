/**
 * City Detail Page
 * Detailed information about a specific city and its events - Generic placeholder
 */

'use client';

import { Container } from '@/components/ui';

export default function CityDetailPage() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Détails de la ville
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Cette fonctionnalité est en cours de développement.
          </p>
        </div>
      </Container>
    </div>
  );
}
