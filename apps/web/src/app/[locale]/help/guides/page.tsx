/**
 * User Guides Page
 *
 * Page displaying user guides and documentation.
 */

'use client';

import { useTranslations } from 'next-intl';
import { UserGuides } from '@/components/help';
import { PageHeader, PageContainer } from '@/components/layout';

export default function UserGuidesPage() {
  const t = useTranslations('help.guides');

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'User Guides'}
        description={t('description') || 'Step-by-step guides and tutorials'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.help') || 'Help', href: '/help' },
          { label: t('breadcrumbs.guides') || 'Guides' },
        ]}
      />

      <div className="mt-8">
        <UserGuides />
      </div>
    </PageContainer>
  );
}
