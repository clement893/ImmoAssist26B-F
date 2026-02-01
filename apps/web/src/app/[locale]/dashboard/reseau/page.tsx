'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import MotionDiv from '@/components/motion/MotionDiv';
import Link from 'next/link';
import { UserCircle, Building2, ArrowRight } from 'lucide-react';

function ReseauContent() {
  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Module Réseau"
        description="Gérez vos contacts et entreprises"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Module Réseau' }]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/dashboard/reseau/contacts">
          <Card className="h-full hover:shadow-standard-lg transition-modern cursor-pointer"> // UI Revamp - Nouveau système d'ombres et transition moderne
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                  <UserCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Contacts</h3>
                  <p className="text-sm text-muted-foreground">Gérez vos contacts</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/dashboard/reseau/entreprises">
          <Card className="h-full hover:shadow-standard-lg transition-modern cursor-pointer"> // UI Revamp - Nouveau système d'ombres et transition moderne
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/40 rounded-lg">
                  <Building2 className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">Entreprises</h3>
                  <p className="text-sm text-muted-foreground">Gérez vos entreprises</p>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">Module Réseau</h2>
          <p className="text-muted-foreground">
            Bienvenue dans le Module Réseau. Utilisez le menu latéral pour accéder aux différentes
            sections.
          </p>
        </div>
      </Card>
    </MotionDiv>
  );
}

export default function ReseauPage() {
  return <ReseauContent />;
}
