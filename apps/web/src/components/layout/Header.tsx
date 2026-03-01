'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/routing';
import { useAuthStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import Button from '../ui/Button';
import { ThemeToggleWithIcon } from '../ui/ThemeToggle';
import LanguageSwitcher from '../i18n/LanguageSwitcher';
import { Menu, X } from 'lucide-react';
import { clsx } from 'clsx';

const NotificationBellConnected = dynamic(
  () => import('../notifications/NotificationBellConnected').then((m) => m.default),
  { ssr: false, loading: () => <span className="w-9 h-9" aria-hidden /> }
);

export default function Header() {
  const { isAuthenticated, user } = useAuthStore();
  const { logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Handle Escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Focus management when menu opens
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const firstLink = mobileMenuRef.current.querySelector('a') as HTMLElement;
      firstLink?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-foreground">
            ImmoAssist
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Navigation principale"
          ></nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggleWithIcon />
            {isAuthenticated() ? (
              <>
                <NotificationBellConnected />
                <span className="text-sm text-muted-foreground hidden lg:block">
                  {user?.name || user?.email}
                </span>
                <Link href="/dashboard">
                  <Button size="sm" variant="ghost">
                    Dashboard
                  </Button>
                </Link>
                <Button size="sm" variant="outline" onClick={logout}>
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button size="sm" variant="ghost">
                    Connexion
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm" variant="primary">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggleWithIcon />
            <button
              ref={menuButtonRef}
              type="button"
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg transition-modern focus:outline-none focus:ring-2 focus:ring-offset-2 text-foreground hover:bg-muted focus:ring-primary min-h-[44px]" // UI Revamp - Transition moderne
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          ref={mobileMenuRef}
          id="mobile-menu"
          className={clsx(
            'md:hidden border-t border-border overflow-hidden transition-modern', // UI Revamp - Transition moderne
            mobileMenuOpen ? 'max-h-[800px] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'
          )}
          role="menu"
          aria-label="Menu mobile"
          aria-hidden={!mobileMenuOpen}
        >
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-foreground hover:text-primary transition-modern px-4 py-3 min-h-[44px] flex items-center rounded-lg hover:bg-muted/50" // UI Revamp - Transition moderne
            >
              Accueil
            </Link>
            {isAuthenticated() && (
              <>
                <div className="px-4 py-3">
                  <NotificationBellConnected />
                </div>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-foreground hover:text-primary-600 dark:hover:text-primary-400 transition-modern px-4 py-3 min-h-[44px] flex items-center rounded-lg hover:bg-muted/50" // UI Revamp - Transition moderne
                >
                  Dashboard
                </Link>
              </>
            )}
            <div className="border-t border-border pt-4 mt-2">
              <div className="px-2 mb-4">
                <LanguageSwitcher />
              </div>
              {isAuthenticated() ? (
                <div className="flex flex-col gap-2 px-2">
                  <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="ghost" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={logout} className="w-full">
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-2">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="ghost" className="w-full">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button size="sm" variant="primary" className="w-full">
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
