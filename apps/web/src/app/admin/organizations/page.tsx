// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function AdminOrganizationsRedirect() {
  redirect(`/${routing.defaultLocale}/admin/organizations`);
}
