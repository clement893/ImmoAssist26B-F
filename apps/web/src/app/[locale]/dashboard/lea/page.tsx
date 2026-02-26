'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import LeaChat from '@/components/lea/LeaChat';

/**
 * Page dédiée à Léa - Agent vocal AI
 * 
 * Interface optimisée pour une conversation vocale naturelle.
 * Léa parle automatiquement et l'interface met l'accent sur l'interaction vocale.
 */
export default function LeaPage() {
  return (
    <div className="h-[calc(100vh-4rem)] min-h-[400px] w-full bg-background">
      <LeaChat />
    </div>
  );
}
