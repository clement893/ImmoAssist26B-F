# 🛠️ Development Guide

This guide covers development tools, workflows, and best practices for the MODELE-NEXTJS-FULLSTACK template.

## 📋 Table of Contents

- [Development Tools](#development-tools)
- [Code Generation](#code-generation)
- [Database Migrations](#database-migrations)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Hot Reload](#hot-reload)
- [Pre-commit Hooks](#pre-commit-hooks)

## 🛠️ Development Tools

### Storybook

Storybook is configured for documenting and testing UI components in isolation.

```bash
# Start Storybook
pnpm storybook

# Build Storybook for production
pnpm build-storybook
```

Storybook will be available at `http://localhost:6006`

### Celery (Background Tasks)

Celery is used for processing background tasks, especially email sending via SendGrid.

```bash
# Start Celery worker (from backend directory)
cd backend
celery -A app.celery_app worker --loglevel=info

# Start with auto-reload (development)
celery -A app.celery_app worker --loglevel=info --reload

# Monitor tasks
celery -A app.celery_app flower  # Optional: Web UI for monitoring
```

**With Docker Compose:**

```bash
# Celery worker is automatically started
docker-compose up celery_worker
```

**Testing Email Tasks:**

```bash
# Test email sending (requires SendGrid API key)
cd backend
python -c "from app.tasks.email_tasks import send_welcome_email_task; send_welcome_email_task.delay('test@example.com', 'Test User')"
```

### Playwright (E2E Testing)

```bash
# Install Playwright browsers
pnpm exec playwright install --with-deps

# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug
```

## 🏗️ Code Generation

### Generate a React Component

```bash
pnpm generate:component ComponentName

# With custom path
node scripts/generate-component.js ComponentName --path=src/components/ui
```

**Files created:**

- `ComponentName/ComponentName.tsx` - Main component
- `ComponentName/index.ts` - Export file
- `ComponentName/ComponentName.module.css` - Styles

### Generate a Next.js Page

```bash
# App Router (default)
pnpm generate:page page-name --app

# Pages Router
pnpm generate:page page-name
```

**Files created:**

- `page-name/page.tsx` - Page component
- `page-name/layout.tsx` - Layout (App Router only)

### Generate an API Route

```bash
# GET route (default)
pnpm generate:api route-name

# POST route
pnpm generate:api route-name --method=POST
```

**Files created:**

- `route-name/route.ts` - API route handler

### Generate TypeScript Types

```bash
# Generate types from Pydantic schemas
pnpm generate:types

# Fallback version (without Python)
pnpm generate:types:fallback
```

Types are generated in `packages/types/src/generated.ts` and exported via `@modele/types`.

## 🗄️ Database Migrations

### Using Alembic

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Check current revision
alembic current

# View migration history
alembic history
```

### Using pnpm scripts

```bash
# Create migration
pnpm migrate create MigrationName

# Apply migrations
pnpm migrate upgrade

# Rollback
pnpm migrate downgrade
```

## 🧪 Testing

### Frontend Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run with UI
pnpm test:ui

# Run in watch mode
pnpm test --watch

# Run with coverage
pnpm test:coverage
```

### Backend Tests (pytest)

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py

# Run with verbose output
pytest -v
```

### E2E Tests (Playwright)

```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# Run on specific browser
pnpm exec playwright test --project=chromium
```

## ✅ Code Quality

### Linting

```bash
# Lint all code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Lint specific package
pnpm --filter @modele/web lint
```

### Type Checking

```bash
# Check TypeScript types
pnpm type-check

# Check specific package
pnpm --filter @modele/web type-check
```

### Formatting

```bash
# Format all code
pnpm format

# Check formatting
pnpm format:check
```

## 🔥 Hot Reload

Hot reload is automatically configured:

- **Frontend**: Next.js hot reload with `next dev`
- **Backend**: FastAPI hot reload with `uvicorn --reload`

### Development Scripts

```bash
# Start everything (frontend + backend)
pnpm dev:full

# Start frontend only
pnpm dev:frontend

# Start backend only
pnpm dev:backend

# Start with Turborepo (recommended)
pnpm dev
```

### Docker Compose

Hot reload is also configured in `docker-compose.yml`:

```yaml
backend:
  command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
  volumes:
    - ./backend:/app # Mount for hot reload
```

## ✅ Pre-commit Hooks

Git hooks are configured with **Husky** and **lint-staged** to:

1. Format and lint only modified files
2. Run TypeScript type checking
3. Run tests (optional)

### Manual Execution

```bash
# Run pre-commit checks manually
pnpm pre-commit

# Skip tests (faster)
pnpm pre-commit:skip-tests
```

### Disable Temporarily

```bash
# Commit without hooks (not recommended)
git commit --no-verify -m "message"
```

## 🚀 Development Workflow

### Recommended Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feat/feature-name
   ```

2. **Generate code if needed**

   ```bash
   pnpm generate:component MyComponent
   pnpm generate:page my-page
   ```

3. **Start development**

   ```bash
   pnpm dev:full
   ```

4. **Test components in Storybook**

   ```bash
   pnpm storybook
   ```

5. **Write tests**

   ```bash
   pnpm test --watch
   ```

6. **Before committing**

   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```

7. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin feat/feature-name
   ```

## 🔧 CI/CD

### GitHub Actions

Two workflows are configured:

1. **CI** (`.github/workflows/ci.yml`)
   - Runs on every push and PR
   - Lint & Type Check
   - Unit Tests
   - Build verification
   - E2E Tests

2. **Deploy** (`.github/workflows/deploy.yml`)
   - Runs only on `main` branch
   - Deploys to Railway automatically

### Railway Deployment

The project uses Nixpacks for automatic builds. Ensure:

1. Railway service points to correct directory
2. Environment variables are configured
3. Build commands are correct in `nixpacks.toml`

## 📦 Monorepo Structure

This project uses a Turborepo monorepo structure:

```
MODELE-NEXTJS-FULLSTACK/
├── apps/
│   └── web/              # Next.js 16 frontend
├── backend/              # FastAPI backend
├── packages/
│   └── types/            # Shared TypeScript types
├── scripts/              # Development scripts
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # pnpm workspace configuration
└── package.json          # Root package.json
```

### Build Pipeline

Build order is automatically handled:

1. `@modele/types` (shared package)
2. `@modele/web` (depends on `@modele/types`)

### Workspace Dependencies

All internal dependencies use `workspace:*` protocol:

```json
{
  "dependencies": {
    "@modele/types": "workspace:*"
  }
}
```

### Workspace Scripts

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:web
pnpm build:types

# Check workspace dependencies
pnpm workspace:check
```

For more details, see [Turborepo Documentation](https://turbo.build/repo/docs) and [pnpm Workspace Documentation](https://pnpm.io/workspaces).

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Railway Documentation](https://docs.railway.app/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
