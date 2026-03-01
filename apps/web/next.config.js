/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');
const { withSentryConfig } = require('@sentry/nextjs');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Ensure proper path resolution in standalone mode
  distDir: '.next',
  // Base path configuration for monorepo
  // This ensures Next.js can resolve paths correctly in standalone mode
  basePath: '',

  // Disable source maps in production for faster builds
  // Source maps are only needed for debugging, not for production builds
  productionBrowserSourceMaps: false,

  // Skip type checking during build (already done in validate-build.js)
  // This saves ~20 seconds per build since type checking is done before build
  // Note: We still want to fail on TypeScript errors, but since validate-build.js already checks,
  // we can skip the redundant check here. If validate-build fails, the build won't reach this point.
  typescript: {
    // Type checking is done in validate-build.js, so we can skip it here for speed
    // But we still want to fail if there are errors (handled by validate-build.js)
    ignoreBuildErrors: false,
    // Note: skipLibCheck is not a valid Next.js config option (it's a TypeScript compiler option)
    // TypeScript lib checking is handled by validate-build.js
  },

  // Note: eslint config in next.config.js is deprecated in Next.js 16+
  // ESLint should be configured via .eslintrc.json or eslint.config.js
  // For now, we keep it for backward compatibility but it will show a warning

  // Performance budgets
  // These limits help prevent bundle size regressions
  // Build will warn if budgets are exceeded
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production (smaller bundles)
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? {
            exclude: ['error', 'warn'],
          }
        : false,
  },

  // Experimental features - performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      '@tanstack/react-query-devtools',
      'zod',
      'clsx',
      'next-intl',
      'recharts', // Optimize chart library imports
    ],
    // Enable faster refresh for better dev experience
    optimizeCss: true,
    // Note: buildTraces is not a valid experimental option in Next.js 16+
    // Build traces are automatically managed by Next.js
    // Enable partial prerendering for better performance
    ppr: false, // Can be enabled when stable
  },

  // Image optimization - enhanced for better performance
  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats for smaller file sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60, // Cache images for 60 seconds
    dangerouslyAllowSVG: true, // Allow SVG images
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Enable lazy loading by default (Next.js Image component does this automatically)
    // Add remote patterns if needed for external images
    remotePatterns: [],
  },

  // SWC minification is enabled by default in Next.js 16+
  // No need to specify swcMinify option

  // Webpack configuration for better code splitting
  webpack: (config, { isServer, dev, webpack }) => {
    // Optimize webpack cache for faster builds
    // Use persistent filesystem cache that survives between builds
    if (!dev) {
      const path = require('path');
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
        cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
        // Improve cache performance
        compression: 'gzip',
        // Cache more aggressively
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      };

      // Optimize module resolution cache
      config.resolve = {
        ...config.resolve,
        cache: true,
        cacheWithContext: false, // Faster cache lookups
      };
    }

    // Add plugin to create missing CSS file during build
    const CreateMissingCssPlugin = require('./webpack-plugins/create-missing-css-plugin');
    config.plugins.push(new CreateMissingCssPlugin());

    // Enhanced code splitting configuration - optimized for performance
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000, // Minimum chunk size (20KB) - prevents too many small chunks
          maxSize: 244000, // Maximum chunk size (244KB) - optimal for HTTP/2
          maxAsyncRequests: 30, // Limit concurrent async chunks
          maxInitialRequests: 30, // Limit initial chunks
          cacheGroups: {
            default: false,
            vendors: false,
            // Framework chunks - React, Next.js core (highest priority)
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
              reuseExistingChunk: true,
            },
            // Large libraries - separate into individual chunks for better caching
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module) {
                const packageName = module.context.match(
                  /[\\/]node_modules[\\/](.*?)([\\/]|$)/
                )?.[1];
                // Only create separate chunks for large libraries
                const largeLibs = [
                  'axios',
                  '@tanstack/react-query',
                  'zod',
                  'zustand',
                  'next-intl',
                  'recharts',
                ];
                if (largeLibs.some((lib) => packageName?.includes(lib))) {
                  return `lib-${packageName?.replace('@', '').replace('/', '-')}`;
                }
                return null;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // UI component libraries - group together for better caching
            ui: {
              test: /[\\/]node_modules[\\/](@tanstack|lucide-react|clsx|isomorphic-dompurify)[\\/]/,
              name: 'ui-libs',
              priority: 20,
              reuseExistingChunk: true,
            },
            // Common chunks - shared code across multiple pages
            common: {
              name: 'common',
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
        // Module concatenation for better tree shaking
        concatenateModules: !dev, // Enable in production only
      };

      // Tree shaking optimization - remove unused exports
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;

      // Minimize bundle size
      config.optimization.minimize = !dev; // Only minimize in production
    }

    // Bundle analyzer (if enabled)
    if (process.env.ANALYZE === 'true' && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: process.env.BUNDLE_ANALYZE === 'server' ? 'server' : 'static',
          openAnalyzer: true,
          reportFilename: `../.next/bundle-analyzer-${isServer ? 'server' : 'client'}.html`,
        })
      );
    }

    return config;
  },

  // Headers for security
  async headers() {
    // Use the same logic as getApiUrl() to determine API URL
    const isProduction = process.env.NODE_ENV === 'production';

    // Priority order: explicit API URL > default API URL
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_DEFAULT_API_URL;

    // Default to localhost for development if nothing is set
    if (!apiUrl) {
      if (isProduction) {
        // In production, fail fast if API URL is not configured
        console.error(
          'ERROR: NEXT_PUBLIC_API_URL is required in production but not set. Please set NEXT_PUBLIC_API_URL environment variable and rebuild.'
        );
        apiUrl = 'http://localhost:8000'; // Fallback to prevent build failure, but will error at runtime
      } else {
        apiUrl = 'http://localhost:8000';
      }
    }

    apiUrl = apiUrl.trim();

    // If URL doesn't start with http:// or https://, add https://
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
    }

    // Remove trailing slash
    apiUrl = apiUrl.replace(/\/$/, '');

    const apiUrlWss = apiUrl.replace(/^https?:\/\//, 'wss://');

    // Content Security Policy
    // ⚠️ SECURITY NOTE: CSP is relaxed in development (unsafe-inline/unsafe-eval)
    // This is acceptable for dev but should be tightened in production using nonces
    // See: https://nextjs.org/docs/advanced-features/security-headers
    // Include both localhost (for dev) and the configured API URL in connect-src
    // Also include WebSocket URLs (wss://) for WebSocket connections
    // Google Maps/Places API for address autocomplete
    const connectSrcUrls = isProduction
      ? [`'self'`, apiUrl, apiUrlWss, 'https://*.sentry.io', 'wss://*.sentry.io', 'https://maps.googleapis.com', 'https://*.googleapis.com']
      : [
          `'self'`,
          apiUrl,
          apiUrlWss,
          'http://localhost:8000',
          'ws://localhost:8000',
          'https://*.sentry.io',
          'wss://*.sentry.io',
          'https://maps.googleapis.com',
          'https://*.googleapis.com',
        ];

    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.railway.app https://maps.googleapis.com https://*.googleapis.com blob:", // Google Maps/Places for address autocomplete
      "worker-src 'self' blob:", // Required for Sentry workers and web workers
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.railway.app", // Required for Tailwind CSS
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      'connect-src ' + connectSrcUrls.join(' '),
      "frame-src 'self' blob: https://www.google.com https://maps.google.com", // blob: PDF viewer; Google Maps embed (transaction map tab)
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      ...(isProduction ? ['upgrade-insecure-requests'] : []),
    ]
      .filter(Boolean)
      .join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives,
          },
          {
            // Allow microphone for voice features (Léa), but restrict camera and geolocation
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: isProduction ? 'max-age=31536000; includeSubDomains; preload' : '',
          },
        ],
      },
      {
        // Ensure CSS files are served with correct Content-Type
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
        ],
      },
      {
        // Ensure JS chunks are never served as other MIME types (avoids 503/CDN serving wrong body)
        source: '/_next/static/chunks/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Wrap Next.js config with Sentry
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps in production
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableClientWebpackPlugin: false,
  disableServerWebpackPlugin: false,
};

// Check if Sentry is configured before wrapping
const isSentryConfigured =
  process.env.SENTRY_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

// Apply Sentry config only if DSN is configured
const configWithSentry = isSentryConfigured
  ? withSentryConfig(withNextIntl(nextConfig), sentryWebpackPluginOptions)
  : withNextIntl(nextConfig);

module.exports = configWithSentry;
