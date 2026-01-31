# 🚀 Local Setup Guide

Quick guide to get your project running locally.

## ✅ Prerequisites Check

You have:

- ✅ Node.js v24.12.0
- ✅ pnpm 9.15.9
- ✅ Python 3.13.9
- ❌ Docker (not installed - we'll use local PostgreSQL)

## 📋 Step-by-Step Setup

### Step 1: Install PostgreSQL (if not already installed)

**Windows:**

1. Download from: https://www.postgresql.org/download/windows/
2. Install PostgreSQL (default port 5432)
3. Remember your postgres user password (default is often "postgres")

**Or use Chocolatey:**

```powershell
choco install postgresql
```

### Step 2: Create Environment Files

#### Backend Environment (`backend/.env`)

Create `backend/.env` file with this content:

```env
# Project Name
PROJECT_NAME=Modele App

# Environment
ENVIRONMENT=development

# Database (REQUIRED)
# Update the database name if different
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db

# Security (REQUIRED)
# Generate a secure key: python -c "import secrets; print(secrets.token_urlsafe(32))"
SECRET_KEY=dev-secret-key-change-this-to-random-32-plus-characters-minimum

# CORS (REQUIRED)
FRONTEND_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000

# Disable rate limiting (no Redis needed)
DISABLE_RATE_LIMITING=true

# Disable CSRF (easier for development)
DISABLE_CSRF=true
```

#### Frontend Environment (`apps/web/.env.local`)

Create `apps/web/.env.local` file with this content:

```env
# API Configuration (REQUIRED)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication (REQUIRED)
# Generate secrets: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
NEXTAUTH_SECRET=dev-nextauth-secret-change-this-to-random-32-plus-characters
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=dev-jwt-secret-change-this-to-random-32-plus-characters

# App Configuration (Optional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MODELE-NEXTJS-FULLSTACK
```

### Step 3: Create PostgreSQL Database

Open PowerShell or Command Prompt and run:

```powershell
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE modele_db;

# Exit psql
\q
```

**Or if psql is not in PATH:**

```powershell
# Find PostgreSQL installation (usually in Program Files)
cd "C:\Program Files\PostgreSQL\16\bin"
.\psql.exe -U postgres
```

### Step 4: Install Python Dependencies (Backend)

```powershell
cd backend
pip install -r requirements.txt
```

### Step 5: Run Database Migrations

```powershell
cd backend
alembic upgrade head
```

### Step 6: Start the Development Servers

**Option A: Start Backend and Frontend Separately**

**Terminal 1 - Backend:**

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**

```powershell
pnpm dev
```

**Option B: Use the root script (if available)**

```powershell
# From project root
pnpm dev
```

## 🎯 Verify Installation

Once both servers are running, open your browser:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs (Swagger)**: http://localhost:8000/docs
- **API Docs (ReDoc)**: http://localhost:8000/redoc

## 🐛 Troubleshooting

### PostgreSQL Connection Error

**Problem**: Cannot connect to database

**Solutions**:

1. Verify PostgreSQL is running:

   ```powershell
   # Check if PostgreSQL service is running
   Get-Service postgresql*
   ```

2. Start PostgreSQL service:

   ```powershell
   Start-Service postgresql-x64-16  # Adjust version number
   ```

3. Verify database exists:
   ```powershell
   psql -U postgres -l
   ```

### Port Already in Use

**Problem**: Port 3000 or 8000 already in use

**Solutions**:

```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Python Module Not Found

**Problem**: `uvicorn` or other modules not found

**Solution**:

```powershell
cd backend
pip install -r requirements.txt
```

### Migration Errors

**Problem**: Alembic migration fails

**Solutions**:

```powershell
cd backend
# Check current migration version
alembic current

# Upgrade to latest
alembic upgrade head

# If issues persist, check database connection in .env
```

## 📚 Next Steps

1. **Explore the Application**
   - Visit http://localhost:3000 to see the frontend
   - Check http://localhost:8000/docs for API documentation
   - Run `pnpm storybook` to explore components

2. **Read Documentation**
   - [README.md](./README.md) - Project overview
   - [GETTING_STARTED.md](./GETTING_STARTED.md) - Detailed setup guide
   - [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development guide

3. **Start Developing**
   - Check out the component library at `/components`
   - Explore example pages at `/examples`
   - Review the code structure in `apps/web/src`

## 💡 Quick Commands Reference

```powershell
# Development
pnpm dev                    # Start frontend
cd backend && python -m uvicorn app.main:app --reload  # Start backend

# Database
cd backend && alembic upgrade head    # Run migrations
cd backend && alembic current         # Check migration version

# Testing
pnpm test                   # Run tests
pnpm test:watch            # Watch mode

# Code Quality
pnpm lint                  # Lint code
pnpm type-check           # Type checking
pnpm format               # Format code
```

---

**Happy coding! 🚀**
