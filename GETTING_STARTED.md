# 🚀 Getting Started Guide

Complete guide to get your project up and running with this full-stack template.

> **📢 Recent Updates:** This template has been improved with enhanced type safety, comprehensive tests, database optimizations, and better code quality. See [TEMPLATE_UPDATES.md](../TEMPLATE_UPDATES.md) for details.

---

## ⚡ Quick Start (5 Minutes)

The fastest way to get started:

```bash
# 1. Clone the template
git clone https://github.com/your-username/your-repo-name.git your-project-name
cd your-project-name

# 2. Run interactive setup
node scripts/quick-start.js
```

The `quick-start` script will:

- ✅ Check prerequisites
- ✅ Install dependencies
- ✅ Generate secure secrets
- ✅ Create environment files
- ✅ Guide you through database setup
- ✅ Run initial migrations

---

## 📋 Prerequisites

Before starting, ensure you have:

### Required

- **Node.js** 20.x or higher
  - Download: [nodejs.org](https://nodejs.org/)
  - Verify: `node --version`

- **pnpm** 9.x or higher
  - Install: `npm install -g pnpm`
  - Verify: `pnpm --version`

- **Git**
  - Download: [git-scm.com](https://git-scm.com/)
  - Verify: `git --version`

### Optional (but recommended)

- **Python** 3.11+ - For type generation from Pydantic schemas
  - Download: [python.org](https://www.python.org/downloads/)
  - Verify: `python --version`

- **PostgreSQL** 14+ - Database (or use Docker)
  - Download: [postgresql.org](https://www.postgresql.org/download/)
  - Or use Docker: `docker run -d -p 5432:5432 postgres:14`

- **Redis** 7+ - For caching and background jobs (or use Docker)
  - Download: [redis.io](https://redis.io/download)
  - Or use Docker: `docker run -d -p 6379:6379 redis:7`

- **Docker & Docker Compose** - For easier local development
  - Download: [docker.com](https://www.docker.com/products/docker-desktop/)

---

## 🛠️ Manual Installation

If you prefer manual setup or the quick-start script doesn't work:

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git your-project-name
cd your-project-name
```

### Step 2: Install Dependencies

```bash
pnpm install
```

This installs dependencies for:

- Frontend (Next.js app)
- Backend (FastAPI)
- Shared packages (TypeScript types)

### Step 3: Configure Environment Variables

#### Backend Configuration

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

**Minimum required variables:**

```env
# Database - REQUIRED
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/your_db_name

# Security - REQUIRED (generate secure keys)
SECRET_KEY=your-secret-key-min-32-characters-long

# Frontend URL - REQUIRED for CORS
FRONTEND_URL=http://localhost:3000

# Redis - Optional (for background jobs)
REDIS_URL=redis://localhost:6379/0

# Email - Optional (for transactional emails)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name
```

**Generate secure secrets:**

```bash
# SECRET_KEY (Python)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# SECRET_KEY (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Frontend Configuration

```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your values
```

**Minimum required variables:**

```env
# API Configuration - REQUIRED
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication - REQUIRED
NEXTAUTH_SECRET=your-nextauth-secret-min-32-characters
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-min-32-characters

# OAuth - Optional
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Stripe - Optional (for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Monitoring - Optional
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

**⚠️ Important for Production:**

- `NEXT_PUBLIC_API_URL` is embedded at **build time** in Next.js
- You **MUST** set `NEXT_PUBLIC_API_URL` before building for production
- If not set, the app will fall back to `localhost:8000` (won't work in production)

### Step 4: Initialize Database

#### Option A: Using PostgreSQL directly

```bash
# Create database
createdb your_db_name

# Or using psql
psql -U postgres
CREATE DATABASE your_db_name;
\q

# Run migrations
cd backend
alembic upgrade head
```

#### Option B: Using Docker

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Run migrations
pnpm migrate
```

### Step 5: Start Development Servers

#### Option A: All-in-One (Recommended)

```bash
# From project root
pnpm dev
```

This starts:

- ✅ Frontend on http://localhost:3000
- ✅ Backend on http://localhost:8000
- ✅ Hot reload enabled for both

#### Option B: Docker Compose (Easiest)

```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend, Celery)
docker-compose up
```

This starts:

- ✅ PostgreSQL on port 5432
- ✅ Redis on port 6379
- ✅ Frontend on http://localhost:3000
- ✅ Backend on http://localhost:8000
- ✅ Celery worker for background jobs
- ✅ Hot reload enabled

#### Option C: Separate Terminals

**Terminal 1 - Backend:**

```bash
cd backend
uvicorn app.main:app --reload
```

**Terminal 2 - Celery Worker (optional, for emails):**

```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

**Terminal 3 - Frontend:**

```bash
cd apps/web
pnpm dev
```

### Step 6: Verify Installation

Open your browser and visit:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc
- **Storybook**: http://localhost:6006 (run `pnpm storybook` first)

---

## 🎯 Next Steps

### 1. Explore the Template

- Visit `/components` to see all UI components
- Visit `/examples` to see SaaS example pages
- Run `pnpm storybook` to explore components interactively

### 2. Customize Your Project

- **Rename the project**: `pnpm rename` (if script exists)
- **Update branding**: Replace "MODELE" in code and config files
- **Configure theme**: Visit `/components/theme` to customize colors
- **Set up OAuth**: Configure Google/GitHub/Microsoft OAuth (see below)

### 3. Set Up OAuth (Optional)

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-domain.com/api/auth/callback/google`
6. Copy Client ID and Secret to `.env.local`

#### GitHub OAuth

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret

#### Microsoft OAuth

1. Go to [Azure Portal](https://portal.azure.com/)
2. Register a new application
3. Configure redirect URIs
4. Copy Client ID and Secret

### 4. Set Up Email (Optional)

#### SendGrid Setup

1. Create account at [SendGrid](https://sendgrid.com)
2. Create API key
3. Verify sender email
4. Add to `.env`:
   ```env
   SENDGRID_API_KEY=your-api-key
   SENDGRID_FROM_EMAIL=verified-email@yourdomain.com
   SENDGRID_FROM_NAME=Your App Name
   ```

### 5. Set Up Payments (Optional)

#### Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Get API keys from dashboard
3. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

---

## 🛠️ Useful Commands

### Development

```bash
pnpm dev              # Start all development servers
pnpm dev:frontend     # Frontend only
pnpm dev:backend      # Backend only
pnpm storybook        # Start Storybook
```

### Code Generation

```bash
pnpm generate:component ComponentName    # Generate React component
pnpm generate:page page-name              # Generate Next.js page
pnpm generate:api route-name              # Generate API route
pnpm generate:types                       # Generate TypeScript types
```

### Database

```bash
pnpm migrate          # Run migrations
pnpm seed             # Seed database
```

### Testing

```bash
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:e2e         # E2E tests
pnpm test:coverage    # Coverage report
```

### Code Quality

```bash
pnpm lint             # Lint code
pnpm lint:fix         # Auto-fix issues
pnpm format           # Format code
pnpm type-check       # Type checking
pnpm check            # Run all checks
```

---

## 🐛 Troubleshooting

### Common Issues

#### "Python not found" error

**Problem**: Type generation requires Python

**Solution**:

```bash
# Use fallback version (no Python required)
pnpm generate:types:fallback
```

#### Database connection error

**Problem**: Cannot connect to PostgreSQL

**Solutions**:

1. Verify PostgreSQL is running: `pg_isready`
2. Check `DATABASE_URL` in `backend/.env`
3. Verify database exists: `psql -l`
4. Check PostgreSQL logs

#### Port already in use

**Problem**: Port 3000 or 8000 already in use

**Solutions**:

```bash
# Find process using port
# Windows
netstat -ano | findstr :3000
# Mac/Linux
lsof -i :3000

# Kill process or change port in .env
```

#### CORS errors

**Problem**: Frontend can't connect to backend

**Solutions**:

1. Verify `FRONTEND_URL` is set in `backend/.env`
2. Ensure URL matches exactly (including `http://` or `https://`)
3. Restart backend after changing environment variables
4. Check backend logs for CORS configuration

#### Build errors

**Problem**: Build fails with TypeScript or other errors

**Solutions**:

```bash
# Clean and rebuild
pnpm clean
pnpm build

# Check for missing dependencies
pnpm install

# Verify environment variables
pnpm validate:env
```

#### Module not found errors

**Problem**: Import errors or missing modules

**Solutions**:

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild shared packages
pnpm build:types
```

### Getting Help

If you're still stuck:

1. Check the [main README](./README.md)
2. Review [TEMPLATE_USAGE.md](./TEMPLATE_USAGE.md)
3. Check [DEVELOPMENT.md](./DEVELOPMENT.md) for development-specific issues
4. [Open an issue](https://github.com/clement893/MODELE-NEXTJS-FULLSTACK/issues)
5. Review error logs carefully

---

## 📚 Additional Resources

- **[Main README](./README.md)** - Overview and features
- **[Template Usage Guide](./TEMPLATE_USAGE.md)** - How to customize the template
- **[Development Guide](./DEVELOPMENT.md)** - Development tools and workflows
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
- **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute

---

## ✅ Checklist

After setup, verify:

- [ ] Frontend runs on http://localhost:3000
- [ ] Backend runs on http://localhost:8000
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Database migrations ran successfully
- [ ] Environment variables configured
- [ ] Storybook runs (`pnpm storybook`)
- [ ] Tests pass (`pnpm test`)
- [ ] Build succeeds (`pnpm build`)

---

**Happy coding! 🚀**

_If you encounter any issues, don't hesitate to [open an issue](https://github.com/clement893/MODELE-NEXTJS-FULLSTACK/issues) or check the documentation._
