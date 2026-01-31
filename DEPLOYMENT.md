# 🚀 Deployment Guide

Complete guide for deploying your application to production.

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [ ] All environment variables are configured
- [ ] Database migrations are ready
- [ ] Build succeeds locally (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Security secrets are strong (32+ characters)
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled
- [ ] Error tracking is set up (Sentry, etc.)

---

## 🌐 Frontend Deployment

### Vercel (Recommended)

Vercel is the easiest way to deploy Next.js applications.

#### Step 1: Prepare Your Project

```bash
# Ensure build works
pnpm build

# Verify .env.local has production values
cat apps/web/.env.local
```

#### Step 2: Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Configure project:
     - **Framework Preset**: Next.js
     - **Root Directory**: `apps/web`
     - **Build Command**: `pnpm build`
     - **Output Directory**: `.next`

3. **Configure Environment Variables**

   In Vercel dashboard → Settings → Environment Variables:

   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your-production-secret
   JWT_SECRET=your-production-secret
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-key
   STRIPE_SECRET_KEY=your-stripe-secret
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `https://your-app.vercel.app`

#### Vercel Configuration File

Create `vercel.json` in project root (optional):

```json
{
  "buildCommand": "cd apps/web && pnpm build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

### Netlify

1. **Build Settings**
   - Build command: `cd apps/web && pnpm build`
   - Publish directory: `apps/web/.next`
   - Install command: `pnpm install`

2. **Environment Variables**
   - Add all `NEXT_PUBLIC_*` variables
   - Add server-side variables

3. **Deploy**
   - Connect GitHub repository
   - Configure build settings
   - Deploy

### Docker

#### Build Docker Image

```bash
# Build frontend image
cd apps/web
docker build -t your-app-frontend .

# Or use the root Dockerfile
cd ../..
docker build -f Dockerfile -t your-app .
```

#### Run Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://your-backend.com \
  -e NEXTAUTH_SECRET=your-secret \
  your-app-frontend
```

#### Docker Compose

```yaml
version: "3.8"
services:
  frontend:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
```

### Standalone Build

Next.js standalone output:

```bash
# Build
cd apps/web
pnpm build

# Run standalone server
cd .next/standalone
node server.js
```

---

## 🔧 Backend Deployment

### Railway (Recommended)

Railway is excellent for FastAPI backends.

#### Step 1: Prepare Backend

```bash
# Ensure backend works locally
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Step 2: Deploy to Railway

1. **Connect Repository**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Service**
   - Root Directory: `backend`
   - Build Command: (auto-detected or `pip install -r requirements.txt`)
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

3. **Add PostgreSQL Database**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway automatically provides `DATABASE_URL`

4. **Configure Environment Variables**

   **⚠️ CRITICAL: CORS Configuration**

   You **MUST** configure CORS to allow requests from your frontend:

   ```env
   # Option 1: Single frontend (Recommended)
   FRONTEND_URL=https://your-frontend.vercel.app

   # Option 2: Multiple origins
   CORS_ORIGINS=https://your-frontend.vercel.app,https://staging.vercel.app
   ```

   **Other required variables:**

   ```env
   # Database (auto-provided by Railway PostgreSQL)
   DATABASE_URL=postgresql+asyncpg://...

   # Security
   SECRET_KEY=your-production-secret-min-32-chars
   ENVIRONMENT=production

   # Bootstrap Superadmin (for initial setup)
   BOOTSTRAP_SUPERADMIN_KEY=your-secure-random-key-here

   # Redis (optional, add Redis service)
   REDIS_URL=redis://...

   # Email
   SENDGRID_API_KEY=your-sendgrid-key
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   SENDGRID_FROM_NAME=Your App Name
   ```

5. **Run Migrations**

   After first deployment, run migrations:

   ```bash
   # Via Railway CLI
   railway run alembic upgrade head

   # Or add as deploy hook in railway.json
   ```

6. **Deploy**
   - Railway will automatically deploy on push to main branch
   - Your API will be available at `https://your-backend.railway.app`

#### Railway Configuration

Create `railway.json` in `backend/`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Render

1. **Create Web Service**
   - Connect GitHub repository
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

2. **Add PostgreSQL**
   - Create PostgreSQL database
   - `DATABASE_URL` is automatically provided

3. **Environment Variables**
   - Add all required variables (same as Railway)

### DigitalOcean App Platform

1. **Create App**
   - Connect GitHub repository
   - Select backend directory
   - Choose Python runtime

2. **Add Database**
   - Create PostgreSQL database
   - `DATABASE_URL` auto-configured

3. **Configure**
   - Build command: `pip install -r requirements.txt`
   - Run command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Docker

#### Build Backend Image

```bash
cd backend
docker build -t your-app-backend .
```

#### Run Container

```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql+asyncpg://... \
  -e SECRET_KEY=your-secret \
  -e FRONTEND_URL=https://your-frontend.com \
  your-app-backend
```

#### Docker Compose (Full Stack)

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: your_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@postgres:5432/your_db
      SECRET_KEY: ${SECRET_KEY}
      FRONTEND_URL: ${FRONTEND_URL}
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - postgres
      - redis

  frontend:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
      NEXTAUTH_URL: http://localhost:3000
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 🔐 Security Configuration

### Generate Production Secrets

```bash
# SECRET_KEY (Python)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# NEXTAUTH_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# JWT_SECRET (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# BOOTSTRAP_SUPERADMIN_KEY (OpenSSL)
openssl rand -hex 32
```

### Security Headers

The template includes security headers. Verify in production:

- ✅ Content-Security-Policy (CSP)
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin

---

## 🐛 Troubleshooting

### CORS Errors

**Error:**

```
Access to fetch at 'https://backend.railway.app/...' from origin 'https://frontend.vercel.app'
has been blocked by CORS policy
```

**Solution:**

1. Verify `FRONTEND_URL` is set in backend environment variables
2. Ensure URL matches exactly (including `https://`, no trailing slash)
3. Restart backend service after changing variables
4. Check backend logs for CORS configuration

**Backend logs should show:**

```
CORS Origins configured: ['https://your-frontend.vercel.app']
```

### Build Errors

**Error:** Build fails in production

**Solutions:**

1. Check build logs for specific errors
2. Verify all `NEXT_PUBLIC_*` variables are set
3. Ensure `NEXT_PUBLIC_API_URL` is set (required!)
4. Check for TypeScript errors: `pnpm type-check`
5. Verify dependencies: `pnpm install`

### Database Connection Errors

**Error:** Cannot connect to database

**Solutions:**

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from deployment platform
3. Ensure database allows connections from deployment IP
4. Verify SSL mode if required: `?sslmode=require`

### Environment Variable Issues

**Error:** Variables not available at runtime

**Solutions:**

1. **Frontend**: Only `NEXT_PUBLIC_*` variables are available in browser
2. **Backend**: All variables are available
3. Restart services after changing environment variables
4. Verify variables are set in deployment platform dashboard

### Port Issues

**Error:** Port already in use or wrong port

**Solutions:**

1. Railway/Render use `$PORT` environment variable automatically
2. Vercel handles ports automatically
3. For Docker, map ports correctly: `-p 8000:8000`

---

## 📊 Monitoring & Observability

### Error Tracking (Sentry)

1. **Create Sentry Project**
   - Go to [sentry.io](https://sentry.io)
   - Create new project (Next.js)
   - Get DSN

2. **Configure**

   ```env
   NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
   ```

3. **Verify**
   - Errors will automatically be tracked
   - Check Sentry dashboard

### Performance Monitoring

The template includes:

- Web Vitals tracking
- Performance Dashboard (`/components/performance`)
- Bundle analysis (`pnpm analyze`)

### Logging

**Backend:**

- Logs are available in Railway/Render dashboard
- Use Python logging: `logger.info()`, `logger.error()`

**Frontend:**

- Browser console logs
- Sentry for error tracking
- Custom logging utilities in `apps/web/src/lib/logger.ts`

---

## 🔄 CI/CD

### GitHub Actions

The template includes CI/CD workflows:

**`.github/workflows/ci.yml`** - Runs on every push/PR:

- Lint & Type Check
- Unit Tests
- Build Verification
- E2E Tests (optional)

**`.github/workflows/deploy.yml`** - Runs on main branch:

- Build and deploy to Railway/Vercel

### Manual Deployment

If not using CI/CD:

```bash
# Build locally
pnpm build

# Deploy frontend (Vercel CLI)
vercel --prod

# Deploy backend (Railway CLI)
railway up
```

---

## 📝 Post-Deployment

### Verify Deployment

1. **Frontend**
   - Visit your Vercel URL
   - Check all pages load
   - Verify API calls work
   - Test authentication

2. **Backend**
   - Visit `/docs` (Swagger UI)
   - Test API endpoints
   - Verify database connection
   - Check logs for errors

### Create Initial Admin User

```bash
# Via Railway CLI
railway run python backend/scripts/create_superadmin.py

# Or use bootstrap endpoint (if configured)
curl -X POST https://your-backend.railway.app/api/v1/auth/bootstrap-superadmin \
  -H "X-Bootstrap-Key: your-bootstrap-key" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "secure-password"}'
```

### Set Up Custom Domain

**Vercel:**

1. Go to Project Settings → Domains
2. Add your domain
3. Configure DNS records

**Railway:**

1. Go to Service Settings → Networking
2. Add custom domain
3. Configure DNS records

---

## 🎯 Deployment Platforms Summary

| Platform         | Frontend     | Backend      | Database    | Best For                  |
| ---------------- | ------------ | ------------ | ----------- | ------------------------- |
| **Vercel**       | ✅ Excellent | ❌           | ❌          | Frontend deployment       |
| **Railway**      | ✅ Good      | ✅ Excellent | ✅ Included | Full-stack, easy setup    |
| **Render**       | ✅ Good      | ✅ Good      | ✅ Included | Full-stack alternative    |
| **Netlify**      | ✅ Excellent | ⚠️ Limited   | ❌          | Frontend deployment       |
| **DigitalOcean** | ✅ Good      | ✅ Good      | ✅ Included | Full control              |
| **Docker**       | ✅           | ✅           | ✅          | Self-hosted, full control |

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

---

**Happy deploying! 🚀**

_For issues, check the troubleshooting section or [open an issue](https://github.com/your-username/your-repo-name/issues)_
