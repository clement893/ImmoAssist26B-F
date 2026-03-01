'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import Lea2View from '@/components/lea/Lea2View';

/**
 * Page Léa2 - Agent AI vocal + texte
 * Volet vocal mis en avant dans l’UI (grand micro central, thème sombre, "Tap to Start").
 */
export default function Lea2Page() {
  return (
    <div className="h-[calc(100vh-4rem)] min-h-[400px] w-full overflow-hidden">
      <Lea2View />
    </div>
  );
}
