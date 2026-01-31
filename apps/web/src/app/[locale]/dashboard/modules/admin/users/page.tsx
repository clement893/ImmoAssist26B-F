'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    router.replace(`/${locale}/admin/users`);
  }, [router, locale]);

  return null;
}
