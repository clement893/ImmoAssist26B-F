# Template Quick Start Guide

**Purpose**: Get your customized backend running in 5 minutes

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Clone and Setup (1 minute)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

---

### Step 2: Configure Environment (2 minutes)

**Copy example configuration**:

```bash
# Copy development example
cp examples/.env.development.example .env
```

**Edit `.env` file** - Minimum required changes:

```env
# 1. Set your project name
PROJECT_NAME=My Awesome App

# 2. Set database URL (create database first)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/mydb

# 3. Generate and set secret key
SECRET_KEY=$(openssl rand -hex 32)  # Linux/Mac
# Or manually: your-random-32-plus-character-secret-key

# 4. Set frontend URL
FRONTEND_URL=http://localhost:3000
```

**That's it!** All other settings have sensible defaults.

---

### Step 3: Setup Database (1 minute)

```bash
# Create database (if using PostgreSQL)
createdb mydb

# Run migrations
alembic upgrade head

# (Optional) Seed database with sample data
python scripts/seed.py
```

---

### Step 4: Start Server (1 minute)

```bash
# Development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using the run script
python run.py
```

**Server running at**: http://localhost:8000
**API Docs at**: http://localhost:8000/docs

---

## ✅ Verify Installation

### 1. Check Health Endpoint

```bash
curl http://localhost:8000/health
```

**Expected response**:

```json
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected"
}
```

### 2. Check API Documentation

Open in browser: http://localhost:8000/docs

You should see Swagger UI with all API endpoints.

### 3. Test Registration

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

**Expected**: `201 Created` with user data

---

## 🎯 Next Steps

### 1. Customize Project Name

Edit `.env`:

```env
PROJECT_NAME=Your App Name
```

### 2. Add Custom Features

See [Template Customization Guide](./TEMPLATE_CUSTOMIZATION.md)

### 3. Configure Optional Services

**Stripe (Payments)**:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**SendGrid (Email)**:

```env
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@example.com
```

**Redis (Caching)**:

```env
REDIS_URL=redis://localhost:6379/0
```

**S3 (File Storage)**:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET_NAME=my-bucket
```

---

## 🔧 Common Customizations

### Change Token Expiration

```env
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=60
```

### Add Custom User Fields

1. Edit `app/models/user.py`
2. Add your fields
3. Create migration: `alembic revision --autogenerate -m "add_fields"`
4. Apply: `alembic upgrade head`

### Add Custom Endpoint

1. Create `app/api/v1/endpoints/custom.py`
2. Add your endpoint
3. Register in `app/api/v1/router.py`

See [Template Customization Guide](./TEMPLATE_CUSTOMIZATION.md) for details.

---

## 📚 Configuration Examples

We provide example configurations for different scenarios:

- **`.env.development.example`** - Development setup
- **`.env.production.example`** - Production setup
- **`.env.minimal.example`** - Minimal setup (no external services)
- **`.env.testing.example`** - Testing setup

Copy the one that fits your needs:

```bash
cp examples/.env.development.example .env
```

---

## 🐛 Troubleshooting

### Database Connection Error

**Problem**: `Connection refused` or `database does not exist`

**Solution**:

1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL is correct
3. Create database: `createdb mydb`
4. Check user permissions

### Port Already in Use

**Problem**: `Address already in use`

**Solution**:

```bash
# Use different port
uvicorn app.main:app --reload --port 8001

# Or kill process using port 8000
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
# Linux/Mac:
lsof -ti:8000 | xargs kill
```

### CORS Errors

**Problem**: CORS errors in browser

**Solution**:

1. Check `CORS_ORIGINS` in `.env`
2. Ensure frontend URL is included
3. Restart server after changing `.env`

### Migration Errors

**Problem**: Migration fails

**Solution**:

```bash
# Check current migration status
alembic current

# Check migration history
alembic history

# If needed, downgrade and retry
alembic downgrade -1
alembic upgrade head
```

---

## 📖 Additional Resources

- [Full Documentation](./README.md)
- [Template Customization Guide](./TEMPLATE_CUSTOMIZATION.md)
- [API Endpoints](./API_ENDPOINTS.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Testing Guide](./README_TESTING.md)

---

## 🎉 You're Ready!

Your backend is now running and ready for customization. Check out the [Template Customization Guide](./TEMPLATE_CUSTOMIZATION.md) to learn how to customize it for your needs.

**Happy Coding! 🚀**
