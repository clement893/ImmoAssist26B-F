/**
 * Marketing Landing Page
 * Professional landing page for ImmoAssist targeting Quebec real estate brokers.
 * Hero is above the fold; other sections are lazy-loaded for better LCP.
 */
'use client';

import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/marketing';

const BelowFoldSections = dynamic(
  () => import('@/components/marketing/BelowFoldSections').then((m) => m.default),
  { ssr: false, loading: () => <div className="min-h-[400px]" aria-hidden /> }
);

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroSection />
      <BelowFoldSections />
    </div>
  );
}
