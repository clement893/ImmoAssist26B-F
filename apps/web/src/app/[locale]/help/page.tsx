/**
 * Help Center Page
 *
 * Main hub for help and support resources.
 */

'use client';

import { useTranslations } from 'next-intl';
import { HelpCenter } from '@/components/help';
import { PageHeader, PageContainer } from '@/components/layout';

export default function HelpPage() {
  const t = useTranslations('help');

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Help Center'}
        description={t('description') || 'Find answers, guides, and get support'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.help') || 'Help' },
        ]}
      />

      <div className="mt-8">
        <HelpCenter />
      </div>
    </PageContainer>
  );
}
