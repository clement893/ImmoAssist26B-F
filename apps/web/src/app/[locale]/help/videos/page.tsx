/**
 * Video Tutorials Page
 *
 * Page displaying video tutorials and demos.
 */

'use client';

import { useTranslations } from 'next-intl';
import { VideoTutorials } from '@/components/help';
import { PageHeader, PageContainer } from '@/components/layout';

export default function VideoTutorialsPage() {
  const t = useTranslations('help.videos');

  return (
    <PageContainer>
      <PageHeader
        title={t('title') || 'Video Tutorials'}
        description={t('description') || 'Watch video tutorials and demos'}
        breadcrumbs={[
          { label: t('breadcrumbs.home') || 'Home', href: '/' },
          { label: t('breadcrumbs.help') || 'Help', href: '/help' },
          { label: t('breadcrumbs.videos') || 'Videos' },
        ]}
      />

      <div className="mt-8">
        <VideoTutorials />
      </div>
    </PageContainer>
  );
}
