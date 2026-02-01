'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoIndex() {
  const router = useRouter();

  useEffect(() => {
    router.push('/demo/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-slate-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
