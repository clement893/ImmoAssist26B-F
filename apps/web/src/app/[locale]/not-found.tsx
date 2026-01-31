/**
 * 404 Not Found Page for Locale Routes
 * Shown when a locale route doesn't exist
 */

'use client';

import { Link } from '@/i18n/routing';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import { useTranslations } from 'next-intl';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-background to-secondary-50 dark:from-muted dark:via-muted dark:to-muted px-4">
      <Container>
        <Card className="max-w-lg w-full mx-auto text-center">
          <div className="p-8 md:p-12">
            <div className="mb-6">
              <div className="text-8xl md:text-9xl font-bold text-primary-600 dark:text-primary-400 mb-4">
                404
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {t('notFound.title') || 'Page non trouvée'}
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                {t('notFound.description') ||
                  "La page que vous recherchez n'existe pas ou a été déplacée."}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('notFound.suggestion') || "Vérifiez l'URL ou retournez à la page d'accueil."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link href="/">
                <Button variant="primary" className="w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  {t('notFound.backHome') || "Retour à l'accueil"}
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('notFound.goBack') || 'Retour'}
              </Button>
              <Link href="/components">
                <Button variant="ghost" className="w-full sm:w-auto">
                  <Search className="w-4 h-4 mr-2" />
                  {t('notFound.browseComponents') || 'Explorer les composants'}
                </Button>
              </Link>
            </div>

            {/* Helpful Links */}
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">
                {t('notFound.helpfulLinks') || 'Liens utiles:'}
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <Link
                  href="/docs"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('notFound.documentation') || 'Documentation'}
                </Link>
                <Link
                  href="/sitemap"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('notFound.sitemap') || 'Plan du site'}
                </Link>
                <Link
                  href="/dashboard"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {t('notFound.dashboard') || 'Dashboard'}
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}
