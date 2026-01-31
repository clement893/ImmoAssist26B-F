/**
 * FAQ Page
 *
 * Page displaying frequently asked questions.
 */

'use client';

import { useTranslations } from 'next-intl';
import { FAQ } from '@/components/help';
import { PageHeader, PageContainer } from '@/components/layout';

export default function FAQPage() {
  const t = useTranslations('help.faq');

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Frequently Asked Questions'}
        description={t('description') || 'Find answers to common questions'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.help') || 'Help', href: '/help' },
          { label: t('breadcrumbs.faq') || 'FAQ' },
        ]}
      />

      <div className="mt-8">
        <FAQ />
      </div>
    </PageContainer>
  );
}
