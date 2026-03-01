import { redirect } from 'next/navigation';

/**
 * Page /dashboard/lea supprimée — redirection vers Léa2.
 */
export default function LeaPageRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/dashboard/lea2`);
}
