/**
 * Locale-based Layout
 * Wraps the app with next-intl provider and RTL support
 */

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import AppProviders from '@/components/providers/AppProviders';
import { App } from '../app';
import { WebVitalsReporter } from '@/components/performance/WebVitalsReporter';
import { PerformanceScripts } from '@/components/performance/PerformanceScripts';
import { ResourceHints } from '@/lib/performance/resourceHints';
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';
import { SchemaMarkup } from '@/components/seo';
import { GoogleAnalytics } from '@/components/marketing/GoogleAnalytics';
import RTLProvider from '@/components/i18n/RTLProvider';
import SkipLink from '@/components/ui/SkipLink';
import { LocaleSync } from '@/components/preferences/LocaleSync';
import type { Locale } from '@/i18n/routing';
import { themeCacheInlineScript } from '@/lib/theme/theme-inline-cache-script';
import LeaWidget from '@/components/lea/LeaWidget';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Optimize font loading - show fallback until font loads
  variable: '--font-inter',
  preload: true, // Preload critical font
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'], // Better fallback
  adjustFontFallback: true, // Adjust fallback font metrics
});

export const metadata: Metadata = {
  title: 'ImmoAssist',
  description: 'Plateforme immobilière avec assistant IA Léa',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // themeColor will be set dynamically by theme system, using a neutral fallback here
  themeColor: '#2563eb', // Fallback - will be overridden by theme when loaded
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Get API URL for resource hints
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_DEFAULT_API_URL ||
    'http://localhost:8000';
  const apiHost = apiUrl.replace(/^https?:\/\//, '').split('/')[0];

  // Generate default Open Graph metadata
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'ImmoAssist';
  const appDescription =
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
    'Plateforme immobilière avec assistant IA Léa';

  return (
    <html lang={locale} className={inter.variable} data-api-url={apiUrl} suppressHydrationWarning>
      <head>
        {/* CRITICAL: Apply theme script FIRST, before any CSS, to prevent flash */}
        {/* This script MUST execute synchronously and block rendering until theme is applied */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeCacheInlineScript,
          }}
        />

        {/* CSS structure with default colors - applied AFTER script sets theme */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* Base structure - default colors prevent flash before theme loads */
              :root {
                /* Font and layout variables */
                --font-family: Inter, system-ui, -apple-system, sans-serif;
                --font-family-heading: Inter, system-ui, -apple-system, sans-serif;
                --font-family-subheading: Inter, system-ui, -apple-system, sans-serif;
                --border-radius: 8px;
                
                /* Default color variables - prevent flash before theme loads */
                /* These will be overridden by themeCacheInlineScript or GlobalThemeProvider */
                --color-background: #ffffff;
                --color-foreground: #0f172a;
                --color-muted: #f1f5f9;
                --color-muted-foreground: #64748b;
                --color-border: #e2e8f0;
                --color-input: #ffffff;
                --color-ring: #2563eb;
                
                /* Default color palette - will be overridden by theme */
                /* Primary shades - prevent flash on gradients */
                --color-primary-50: #eff6ff;
                --color-primary-100: #dbeafe;
                --color-primary-200: #bfdbfe;
                --color-primary-300: #93c5fd;
                --color-primary-400: #60a5fa;
                --color-primary-500: #2563eb;
                --color-primary-600: #1d4ed8;
                --color-primary-700: #1e40af;
                --color-primary-800: #1e3a8a;
                --color-primary-900: #1e3a8a;
                --color-primary-950: #172554;
                /* Secondary shades */
                --color-secondary-50: #f5f3ff;
                --color-secondary-100: #ede9fe;
                --color-secondary-200: #ddd6fe;
                --color-secondary-300: #c4b5fd;
                --color-secondary-400: #a78bfa;
                --color-secondary-500: #6366f1;
                --color-secondary-600: #4f46e5;
                --color-secondary-700: #4338ca;
                --color-secondary-800: #3730a3;
                --color-secondary-900: #312e81;
                --color-secondary-950: #1e1b4b;
                /* Other colors */
                --color-danger-500: #dc2626;
                --color-warning-500: #b45309;
                --color-info-500: #0891b2;
                --color-success-500: #047857;
              }
              
              /* Dark mode defaults - applied when .dark class is present */
              .dark {
                --color-background: #0f172a;
                --color-foreground: #f8fafc;
                --color-muted: #1e293b;
                --color-muted-foreground: #94a3b8;
                --color-border: #334155;
                --color-input: #1e293b;
              }
              
              /* Body uses CSS variables - NO transition on initial load to prevent flash */
              /* Transition only applies after initial render */
              body {
                background-color: var(--color-background) !important;
                color: var(--color-foreground) !important;
                font-family: var(--font-family, Inter, system-ui, sans-serif);
              }
              
              /* Enable transitions only after initial load */
              body.loaded {
                transition: background-color 0.2s ease, color 0.2s ease;
              }
            `,
          }}
        />

        {/* Add loaded class to body after initial render to enable transitions */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Wait for DOM to be ready
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    document.body.classList.add('loaded');
                  });
                } else {
                  // DOM already ready, add class immediately
                  document.body.classList.add('loaded');
                }
              })();
            `,
          }}
        />

        {/* Resource hints for performance - optimized order */}
        {apiHost && (
          <>
            <link rel="dns-prefetch" href={`//${apiHost}`} />
            <link rel="preconnect" href={`//${apiHost}`} crossOrigin="anonymous" />
          </>
        )}
        {/* Font optimization - preconnect early */}
        {/* Note: next/font/google handles font preloading automatically, no manual preload needed */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Open Graph tags */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={appName} />
        <meta
          property="og:locale"
          content={
            locale === 'fr'
              ? 'fr_FR'
              : locale === 'ar'
                ? 'ar_SA'
                : locale === 'he'
                  ? 'he_IL'
                  : 'en_US'
          }
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body
        className={`${inter.className} bg-background text-foreground`}
        style={{
          fontFamily: 'var(--font-family, Inter, system-ui, sans-serif)',
          backgroundColor: 'var(--color-background)',
          color: 'var(--color-foreground)',
        }}
        suppressHydrationWarning
        // Note: suppressHydrationWarning can be removed after testing confirms no hydration errors
        // We've fixed the root cause (removed direct body style manipulation from inline script)
      >
        <SkipLink />
        <SchemaMarkup
          type="organization"
          data={{
            name: appName,
            url: baseUrl,
            description: appDescription,
          }}
        />
        <SchemaMarkup
          type="website"
          data={{
            name: appName,
            url: baseUrl,
            description: appDescription,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/search?q={search_term_string}`,
              },
            },
          }}
        />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        <NextIntlClientProvider messages={messages}>
          <RTLProvider>
            <PerformanceScripts />
            <ResourceHints />
            <ErrorBoundary>
              <AppProviders>
                <LocaleSync>
                  <App>{children}</App>
                  <LeaWidget />
                </LocaleSync>
              </AppProviders>
            </ErrorBoundary>
            <WebVitalsReporter />
          </RTLProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
