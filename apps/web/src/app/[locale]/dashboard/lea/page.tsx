'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import Container from '@/components/ui/Container';
import LeaChat from '@/components/lea/LeaChat';

export default function LeaPage() {
  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Léa - Assistante AI</h1>
        <p className="text-muted-foreground">
          Votre assistante AI intelligente spécialisée dans l'immobilier. Posez-lui des questions,
          recherchez des informations dans la base de données, ou utilisez la fonction vocale.
        </p>
      </div>

      <div className="h-[calc(100vh-250px)] min-h-[600px]">
        <LeaChat />
      </div>
    </Container>
  );
}
