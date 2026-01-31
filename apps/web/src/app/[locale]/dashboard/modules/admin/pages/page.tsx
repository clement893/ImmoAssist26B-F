'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminPagesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    router.replace(`/${locale}/admin/pages`);
  }, [router, locale]);

  return null;
}
