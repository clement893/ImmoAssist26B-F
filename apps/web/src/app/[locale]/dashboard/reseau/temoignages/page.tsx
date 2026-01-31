'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';

function TemoignagesContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Témoignages"
        description="Gérez les témoignages clients"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Témoignages' },
        ]}
      />

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground">Témoignages</h2>
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function TemoignagesPage() {
  return <TemoignagesContent />;
}
