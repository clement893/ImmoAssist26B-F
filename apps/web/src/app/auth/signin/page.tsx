'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

/**
 * Sign In Page - Alternative login page
 * This is a redirect page that sends users to the main login page
 */
export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main login page
    router.replace('/auth/login');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Container>
        <Card className="text-center">
          <div className="py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Redirection vers la page de connexion...
            </p>
            <Link href="/auth/login">
              <Button variant="outline">Cliquez ici si la redirection ne fonctionne pas</Button>
            </Link>
          </div>
        </Card>
      </Container>
    </div>
  );
}
