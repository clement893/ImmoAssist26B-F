/**
 * Redirect /auth/login to locale-specific route
 * With next-intl, auth routes should be under [locale]
 */
import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

export default function LoginRedirect() {
  redirect(`/${routing.defaultLocale}/auth/login`);
}
