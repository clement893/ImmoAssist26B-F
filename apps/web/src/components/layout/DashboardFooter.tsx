'use client';
import Link from 'next/link';
import { Home, HelpCircle, Settings } from 'lucide-react';
export default function DashboardFooter() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-background border-t border-border mt-auto">
      {' '}
      <div className="px-4 md:px-6 xl:px-8 2xl:px-10 py-4">
        {' '}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {' '}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {' '}
            <Link
              href="/"
              className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              {' '}
              <Home className="w-4 h-4" /> <span>Retour à l'accueil</span>{' '}
            </Link>{' '}
            <Link
              href="/help"
              className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              {' '}
              <HelpCircle className="w-4 h-4" /> <span>Aide</span>{' '}
            </Link>{' '}
            <Link
              href="/settings"
              className="flex items-center gap-2 hover:text-primary-600 dark:hover:text-primary-400 transition"
            >
              {' '}
              <Settings className="w-4 h-4" /> <span>Paramètres</span>{' '}
            </Link>{' '}
          </div>{' '}
          <div className="text-sm text-muted-foreground">
            {' '}
            <p>© {currentYear} ImmoAssist. Tous droits réservés.</p>
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </footer>
  );
}
