'use client';

/**
 * Theme Builder Page
 * Visual theme editor with live preview and presets
 */

import { PageHeader, PageContainer } from '@/components/layout';
import { Button } from '@/components/ui';
import { ThemeBuilder } from './components/ThemeBuilder';
import ProtectedSuperAdminRoute from '@/components/auth/ProtectedSuperAdminRoute';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ThemeBuilderPageContent() {
  return (
    <PageContainer>
      <PageHeader
        title="Theme Builder"
        description="Visual theme editor with live preview, presets, and export/import"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Administration', href: '/admin' },
          { label: 'Themes', href: '/admin/themes' },
          { label: 'Builder' },
        ]}
      />

      <div className="mt-6">
        <div className="mb-4">
          <Link href="/admin/themes">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Themes
            </Button>
          </Link>
        </div>

        <ThemeBuilder />
      </div>
    </PageContainer>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function ThemeBuilderPage() {
  return (
    <ProtectedSuperAdminRoute>
      <ThemeBuilderPageContent />
    </ProtectedSuperAdminRoute>
  );
}
