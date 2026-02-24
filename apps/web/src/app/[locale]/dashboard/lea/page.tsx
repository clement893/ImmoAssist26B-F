'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import LeaChat from '@/components/lea/LeaChat';

export default function LeaPage() {
  return (
    <div className="h-[calc(100vh-4rem)] min-h-[400px] w-full">
      <LeaChat />
    </div>
  );
}
