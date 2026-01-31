/**
 * Root Page - Redirects to default locale
 */

import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
