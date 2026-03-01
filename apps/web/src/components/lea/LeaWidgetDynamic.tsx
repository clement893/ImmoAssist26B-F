'use client';

import dynamic from 'next/dynamic';

/**
 * Client-only wrapper for LeaWidget.
 * Required because `next/dynamic` with `ssr: false` is not allowed in Server Components (Next.js 16+).
 */
const LeaWidget = dynamic(() => import('@/components/lea/LeaWidget'), { ssr: false });

export default function LeaWidgetDynamic() {
  return <LeaWidget />;
}
