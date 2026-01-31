// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function AdminLogsRedirect() {
  redirect(`/${routing.defaultLocale}/admin-logs/testing`);
}
