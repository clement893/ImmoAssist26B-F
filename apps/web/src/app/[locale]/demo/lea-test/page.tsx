'use client';

import Lea2View from '@/components/lea/Lea2View';
import { demoLeaAPI } from '@/lib/api';

const LEA_DEMO_ACCOUNT = 'clement@nukleo.com';

/**
 * Public LEA test page: uses your account data (clement@nukleo.com) without login.
 * Clients can try Léa (real AI, real transactions/context) via the Next.js proxy
 * that sends LEA_DEMO_TOKEN to the backend. No auth required.
 */
export default function LeaTestPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] min-h-[400px] w-full">
      <div className="shrink-0 px-4 py-2 bg-muted/60 border-b border-border rounded-t-lg">
        <p className="text-sm text-muted-foreground">
          Mode démo – connecté au compte <strong>{LEA_DEMO_ACCOUNT}</strong>. Vous pouvez tester Léa sans vous connecter.
        </p>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden rounded-b-lg">
        <Lea2View
          demoMode
          demoUserName="Invité"
          leaApi={demoLeaAPI}
        />
      </div>
    </div>
  );
}
