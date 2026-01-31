FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app

# Copy root package files for monorepo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package files
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install all dependencies (including workspace dependencies)
RUN pnpm install --frozen-lockfile

# Build types package first
FROM base AS types-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY packages/types ./packages/types
RUN pnpm --filter @modele/types build

# Build application
FROM base AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/turbo.json ./turbo.json

# Copy built types
COPY --from=types-builder /app/packages/types/dist ./packages/types/dist

# Copy source code
COPY apps/web ./apps/web
COPY packages/types ./packages/types

# Build application
WORKDIR /app
RUN pnpm --filter @modele/web build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/types/package.json ./packages/types/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

# Start application
WORKDIR /app/apps/web
CMD ["pnpm", "start"]
