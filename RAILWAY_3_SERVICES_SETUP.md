# Railway 3 Services Setup Guide

This guide explains how to deploy your monorepo as **3 separate services** on Railway.

## 🎯 Required Services

1. **Frontend** (Next.js) - Root directory
2. **Backend** (FastAPI) - `backend/` directory
3. **PostgreSQL Database** - Railway plugin

---

## 📋 Step-by-Step Setup

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `clement893/ERP-Nukleo`

---

### Step 2: Add Frontend Service

1. In your Railway project, click **"New"** → **"GitHub Repo"**
2. Select the same repository again (or use the existing one)
3. **Configure the service:**
   - **Name**: `frontend` or `web`
   - **Root Directory**: Leave empty (root directory) or set to `.`
   - **Build Command**: Auto-detected (uses `Dockerfile` or `nixpacks.toml`)
   - **Start Command**: Auto-detected from `railway.json`

4. **Verify Configuration:**
   - Railway should detect `railway.json` at root
   - It will use the Dockerfile build
   - Start command: `node /app/apps/web/server.js`

5. **Environment Variables** (add these):
   ```env
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   NEXT_PUBLIC_APP_URL=https://your-frontend.railway.app
   NEXTAUTH_URL=https://your-frontend.railway.app
   NEXTAUTH_SECRET=your-secret-key-here
   ```

---

### Step 3: Add Backend Service

1. In your Railway project, click **"New"** → **"GitHub Repo"**
2. Select the same repository
3. **Configure the service:**
   - **Name**: `backend` or `api`
   - **Root Directory**: `backend` ⚠️ **CRITICAL: Set this to `backend`**
   - **Build Command**: Auto-detected (uses `backend/nixpacks.toml`)
   - **Start Command**: Auto-detected from `backend/railway.json`

4. **Verify Configuration:**
   - Railway should detect `backend/railway.json`
   - It will use Nixpacks builder
   - Start command: `sh entrypoint.sh`

5. **Environment Variables** (add these):
   ```env
   ENVIRONMENT=production
   PORT=8000
   DATABASE_URL=${{Postgres.DATABASE_URL}}  # Reference PostgreSQL service
   REDIS_URL=${{Redis.REDIS_URL}}  # If you add Redis
   SECRET_KEY=your-production-secret-key-min-32-chars
   FRONTEND_URL=https://your-frontend.railway.app
   BOOTSTRAP_SUPERADMIN_KEY=your-bootstrap-key
   # Léa AI - Agent externe (obligatoire pour chat texte + vocal)
   AGENT_API_URL=https://immoassist-agent.railway.app
   AGENT_API_KEY=your-agent-api-key
   ```

   > **Important pour Léa** : `AGENT_API_URL` et `AGENT_API_KEY` doivent être définis **dans le service Backend** (pas le Frontend). Railway → projet → service Backend → Variables.

---

### Step 4: Add PostgreSQL Database

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically:
   - Create a PostgreSQL database
   - Provide `DATABASE_URL` environment variable
   - Make it available to other services

3. **Link to Backend:**
   - Go to your Backend service settings
   - Add environment variable: `DATABASE_URL=${{Postgres.DATABASE_URL}}`
   - Railway will automatically inject the connection string

---

### Step 5: Configure Service Dependencies

1. **Backend depends on PostgreSQL:**
   - In Backend service → Settings → Variables
   - Add: `DATABASE_URL=${{Postgres.DATABASE_URL}}`

2. **Frontend depends on Backend:**
   - In Frontend service → Settings → Variables
   - Add: `NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}`
   - Or use the custom domain if configured

---

## 🔧 Service Configuration Summary

### Frontend Service

```
Service Name: frontend
Root Directory: . (root)
Builder: Dockerfile (from root)
Start Command: node /app/apps/web/server.js
Port: 3000
```

### Backend Service

```
Service Name: backend
Root Directory: backend
Builder: Nixpacks (from backend/nixpacks.toml)
Start Command: sh entrypoint.sh
Port: 8000
```

### PostgreSQL Service

```
Service Name: postgres (auto-named)
Type: PostgreSQL Plugin
Auto-provides: DATABASE_URL
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Only 1 Service Detected

**Problem**: Railway only detects one service from the monorepo.

**Solution**:

1. Make sure you're creating **separate services** (not just one)
2. Each service must have a different **Root Directory**:
   - Frontend: `.` (root)
   - Backend: `backend`
3. Railway will detect `railway.json` in each directory

---

### Issue 2: Backend Can't Find Files

**Problem**: Backend service fails because it's looking in the wrong directory.

**Solution**:

- **CRITICAL**: Set **Root Directory** to `backend` in Railway service settings
- Verify `backend/railway.json` exists
- Verify `backend/nixpacks.toml` exists

---

### Issue 3: Frontend Can't Connect to Backend

**Problem**: Frontend gets CORS errors or can't reach backend.

**Solution**:

1. **Backend CORS Configuration:**

   ```env
   FRONTEND_URL=https://your-frontend.railway.app
   ```

   Or multiple origins:

   ```env
   CORS_ORIGINS=https://your-frontend.railway.app,https://staging.railway.app
   ```

2. **Frontend API URL:**

   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

3. **Use Railway Service References:**
   ```env
   # In Frontend service
   NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```

---

### Issue 4: Database Migrations Not Running

**Problem**: Database schema is not initialized.

**Solution**:

1. **Option 1: Manual Migration**

   ```bash
   railway run -s backend alembic upgrade head
   ```

2. **Option 2: Auto-migration in entrypoint.sh**
   - Already configured in `backend/entrypoint.sh`
   - Should run automatically on startup

---

## 📝 Railway Configuration Files

### Root `railway.json` (Frontend)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node /app/apps/web/server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "healthcheckInterval": 10
  }
}
```

### `backend/railway.json` (Backend)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "sh entrypoint.sh",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 120,
    "healthcheckInterval": 15
  }
}
```

---

## ✅ Verification Checklist

- [ ] Frontend service created with root directory `.`
- [ ] Backend service created with root directory `backend`
- [ ] PostgreSQL database service added
- [ ] Frontend environment variables configured
- [ ] Backend environment variables configured
- [ ] `DATABASE_URL` linked from PostgreSQL to Backend
- [ ] `NEXT_PUBLIC_API_URL` points to Backend service
- [ ] `FRONTEND_URL` configured in Backend for CORS
- [ ] All services are deploying successfully
- [ ] Frontend can reach Backend API
- [ ] Backend can connect to PostgreSQL

---

## 🎯 Quick Setup Commands

If using Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Deploy frontend (from root)
railway up --service frontend

# Deploy backend (from backend directory)
cd backend
railway up --service backend

# Run migrations
railway run --service backend alembic upgrade head
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Monorepo Guide](https://docs.railway.app/guides/monorepos)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)

---

## 🔍 Troubleshooting

### Check Service Logs

1. **Frontend Logs:**

   ```bash
   railway logs --service frontend
   ```

2. **Backend Logs:**
   ```bash
   railway logs --service backend
   ```

### Verify Service Configuration

1. Go to Railway Dashboard
2. Click on each service
3. Check **Settings** → **Root Directory**
4. Check **Settings** → **Build & Deploy**
5. Check **Variables** → **Environment Variables**

---

**Last Updated**: 2025-12-29
