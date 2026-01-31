'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import Container from '@/components/ui/Container';
import LeaChat from '@/components/lea/LeaChat';

function AgentsContent() {
  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Léa - Votre Agent IA</h1>
            <p className="text-muted-foreground mt-1">
              Discutez avec Léa, votre assistant intelligent pour l'immobilier
            </p>
          </div>
        </div>

        {/* Léa Chat Interface - Full page */}
        <div className="w-full h-[calc(100vh-250px)] min-h-[600px]">
          <LeaChat />
        </div>
      </div>
    </Container>
  );
}

export default function AgentsPage() {
  return <AgentsContent />;
}
