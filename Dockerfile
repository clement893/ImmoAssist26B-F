# Multi-stage build for production
# syntax=docker/dockerfile:1
# Use BuildKit for cache mounts (faster pnpm install between builds)
FROM node:22-alpine AS base

# Install pnpm only (Sharp will use prebuilt binaries - faster than building from source)
# Removed vips-dev, python3, make, g++ - Sharp will download prebuilt binaries instead
RUN npm install -g pnpm@9.15.9

# Install dependencies (including devDependencies for build)
FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/reseau/package.json ./packages/reseau/
COPY packages/transactions/package.json ./packages/transactions/
COPY packages/admin/package.json ./packages/admin/
COPY packages/profil/package.json ./packages/profil/
COPY packages/formulaire/package.json ./packages/formulaire/
COPY packages/config/package.json ./packages/config/

# Install dependencies
# Sharp will automatically download prebuilt binaries (faster than building from source)
# Note: Railway cache mounts require id=s/<service-id>-<path> (see docs.railway.app/reference/dockerfiles).
# Configure pnpm store and install
RUN pnpm config set store-dir .pnpm-store
RUN pnpm install --frozen-lockfile || \
    (echo "Retrying installation with relaxed lockfile..." && sleep 5 && pnpm install --no-frozen-lockfile) || \
    (echo "Final retry..." && pnpm install --no-frozen-lockfile)

# Build application
FROM base AS builder
WORKDIR /app
# Configure pnpm to use the same store directory as deps stage
# Railway caches .pnpm-store automatically via railway.json
RUN pnpm config set store-dir .pnpm-store
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/apps/web/package.json ./apps/web/package.json
COPY --from=deps /app/packages/types/package.json ./packages/types/package.json
COPY --from=deps /app/packages/ui/package.json ./packages/ui/package.json
COPY --from=deps /app/packages/reseau/package.json ./packages/reseau/package.json
COPY --from=deps /app/packages/transactions/package.json ./packages/transactions/package.json
COPY --from=deps /app/packages/admin/package.json ./packages/admin/package.json
COPY --from=deps /app/packages/profil/package.json ./packages/profil/package.json
COPY --from=deps /app/packages/formulaire/package.json ./packages/formulaire/package.json
COPY --from=deps /app/packages/config/package.json ./packages/config/package.json
# Reinstall to recreate symlinks for binaries
# Railway caches .pnpm-store automatically via railway.json, so pnpm will reuse cached packages
# Use --prefer-offline to use cache if available, but don't fail if not
# Use --frozen-lockfile for faster installs (lockfile is already validated in deps stage)
RUN pnpm install --prefer-offline --frozen-lockfile || pnpm install --prefer-offline --no-frozen-lockfile

# Copy and build types package first (required for web app build)
# Copy tsconfig.base.json first (required by packages/types/tsconfig.json)
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/types ./packages/types
RUN cd packages/types && pnpm build && ls -la dist/

# Verify types package was built correctly
RUN test -f packages/types/dist/theme.d.ts || (echo "ERROR: theme.d.ts not found after build" && exit 1)

# Copy source code (copy last to maximize cache hits)
# Copy only what's needed for build (apps/web and shared packages)
COPY apps/web ./apps/web
COPY packages ./packages
# Copy the API manifest script (needed for api:manifest build step)
# Copy directly to apps/web/scripts so it's accessible during build
RUN mkdir -p apps/web/scripts
COPY scripts/generate-frontend-api-manifest.js apps/web/scripts/generate-frontend-api-manifest.js

# No need to reinstall here - workspace links are already correct from previous install
# The types package build doesn't require a reinstall since it's already linked

# Railway passes environment variables, but they need to be available during build
# We use ARG to accept them and ENV to make them available to Next.js
# Railway automatically passes all environment variables, but we need to explicitly accept them
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_DEFAULT_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

# Convert ARG to ENV so Next.js can access them during build
# Next.js only reads NEXT_PUBLIC_* variables from ENV, not ARG
# Use ${VAR:-} syntax to allow empty values (Railway might not pass all vars)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-}
ENV NEXT_PUBLIC_DEFAULT_API_URL=${NEXT_PUBLIC_DEFAULT_API_URL:-}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-}
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}
ENV NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN:-}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID:-}

ENV PATH="/app/node_modules/.bin:$PATH"

# Prepare build environment: create .env.local from environment variables
# Railway passes environment variables, but they may not be available as build args
# This script reads them from the environment and creates .env.local for Next.js
RUN cd apps/web && node scripts/prepare-build-env.js

# Run pre-build validation to catch errors early (before expensive build process)
# Type check is skipped by default in Docker (saves ~25-80s): Next.js still runs TypeScript during build.
# Set SKIP_TYPE_CHECK=0 in Railway build args to run full validation (e.g. if you don't run type-check in CI).
ARG SKIP_TYPE_CHECK=1
ENV SKIP_TYPE_CHECK=${SKIP_TYPE_CHECK}
RUN cd apps/web && node scripts/validate-build.js

# Build Next.js application
# Uses Webpack by default in production (more stable with next-auth catch-all routes)
# Turbopack has issues with vendored Next.js modules in catch-all routes
# Next.js will read variables from .env.local (created above) or ENV
# Disable Next.js telemetry for faster builds (no network calls during build)
# Type checking: run by Next.js during build (validate-build type-check skipped by default to save ~25-80s)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PRIVATE_STANDALONE=true
# Increase Node memory for faster webpack compilation (reduces OOM risk on large apps)
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN cd apps/web && USE_WEBPACK=true pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
# Next.js standalone mode creates .next/standalone with server.js at apps/web/server.js
# The standalone directory already contains the correct structure, so we copy it as-is
# Note: Standalone mode includes .next/static files, but we need to ensure they're accessible
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy public files (standalone doesn't include public directory)
COPY --from=builder /app/apps/web/public ./apps/web/public
# Copy static files - standalone includes them but we ensure they're in the right place
# Static files must be at apps/web/.next/static relative to server.js location
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Also ensure static files are accessible from root for Next.js routing
COPY --from=builder /app/apps/web/.next/static ./.next/static

# Create .next/browser directory and default-stylesheet.css if it doesn't exist
# This file is created during build but may not be included in standalone mode
RUN mkdir -p /app/apps/web/.next/browser && \
    echo '/* Empty stylesheet - created by Dockerfile */' > /app/apps/web/.next/browser/default-stylesheet.css

# Set working directory to where server.js is located BEFORE switching user
# This ensures Next.js can find static files and other resources correctly
WORKDIR /app/apps/web

USER nextjs

# Railway provides PORT via environment variable, default to 3000 for local development
EXPOSE 3000

# Use PORT from Railway environment, fallback to 3000
ENV PORT=${PORT:-3000}
ENV HOSTNAME="0.0.0.0"

# Use ENTRYPOINT to prevent Railway from overriding the command
# This ensures Railway executes node directly without shell parsing
# Use exec form to avoid shell interpretation
# Run server.js from the apps/web directory
# Also ensure CSS file exists at runtime
ENTRYPOINT ["/usr/bin/env", "sh", "-c"]
CMD ["node scripts/ensure-css-at-runtime.js && node server.js"]

