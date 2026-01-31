/**
 * 404 Not Found Page
 * Shown when a route doesn't exist
 */

'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';

import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-muted dark:via-muted dark:to-muted px-4">
      <Container>
        <Card className="max-w-lg w-full mx-auto text-center">
          <div className="p-8 md:p-12">
            <div className="mb-6">
              <h1 className="text-8xl md:text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">
                404
              </h1>
              <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
                Page non trouvée
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                La page que vous recherchez n'existe pas ou a été déplacée.
              </p>
              <p className="text-sm text-muted-foreground">
                Vérifiez l'URL ou retournez à la page d'accueil.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  <Home className="w-3.5 h-3.5 mr-1.5" />
                  Retour à l'accueil
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Link href="/components">
                <Button variant="ghost" className="w-full sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Explorer les composants
                </Button>
              </Link>
            </div>
            {/* Helpful Links */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Liens utiles:</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link
                  href="/docs"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Documentation
                </Link>
                <Link
                  href="/sitemap"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Plan du site
                </Link>
                <Link
                  href="/dashboard"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
