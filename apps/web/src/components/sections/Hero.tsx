'use client';

import { useEffect, useState } from 'react';
import ButtonLink from '../ui/ButtonLink';
import Badge from '../ui/Badge';
import { clsx } from 'clsx';

export default function Hero() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check for prefers-reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Lazy load animations after initial render
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      clearTimeout(timer);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 dark:from-muted dark:via-muted dark:to-muted overflow-hidden">
      {/* Background decoration - Optimized with will-change and reduced opacity */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={clsx(
            'absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl opacity-10',
            !prefersReducedMotion && isLoaded && 'animate-blob',
            'will-change-transform'
          )}
          style={{
            ...(prefersReducedMotion ? { animation: 'none' } : { animationDelay: '0s' }),
          }}
          aria-hidden="true"
        />
        <div
          className={clsx(
            'absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-10',
            !prefersReducedMotion && isLoaded && 'animate-blob',
            'will-change-transform'
          )}
          style={{
            ...(prefersReducedMotion ? { animation: 'none' } : { animationDelay: '6.67s' }),
          }}
          aria-hidden="true"
        />
        <div
          className={clsx(
            'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-10',
            !prefersReducedMotion && isLoaded && 'animate-blob',
            'will-change-transform'
          )}
          style={{
            ...(prefersReducedMotion ? { animation: 'none' } : { animationDelay: '13.33s' }),
          }}
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
        <Badge
          variant="info"
          className="mb-4 sm:mb-6 animate-fade-in"
          aria-label="Badge: Template Full-Stack Nukleo"
        >
          🚀 Template Full-Stack Nukleo
        </Badge>

        <h1
          className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-foreground mb-4 sm:mb-6 leading-[1.1] px-2 animate-fade-in"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="block mb-2">MODELE-NEXTJS</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-primary-400 dark:from-primary-400 dark:via-primary-300 dark:to-primary-200">
            FULLSTACK
          </span>
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2 font-medium animate-fade-in"
          style={{ animationDelay: '0.2s' }}
        >
          Un template de production prêt à l'emploi avec Next.js 16, React 19, FastAPI et
          PostgreSQL. Démarrez votre projet rapidement avec une architecture moderne.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-2">
          <ButtonLink href="/auth/register" size="lg" variant="primary">
            Commencer maintenant
          </ButtonLink>
          <ButtonLink href="/components" size="lg" variant="secondary">
            Voir les composants
          </ButtonLink>
          <ButtonLink href="/monitoring" size="lg" variant="secondary">
            Monitoring
          </ButtonLink>
          <ButtonLink href="/auth/login" size="lg" variant="outline">
            Se connecter
          </ButtonLink>
        </div>

        <div
          className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-muted-foreground px-2"
          role="list"
          aria-label="Caractéristiques principales"
        >
          <div className="flex items-center gap-2" role="listitem">
            <svg
              className="w-5 h-5 text-secondary-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>TypeScript</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <svg
              className="w-5 h-5 text-secondary-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Production Ready</span>
          </div>
          <div className="flex items-center gap-2" role="listitem">
            <svg
              className="w-5 h-5 text-secondary-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Open Source</span>
          </div>
        </div>
      </div>
    </section>
  );
}
