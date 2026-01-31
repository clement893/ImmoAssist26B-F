# Deployment Scripts

This directory contains scripts for deployment health checks and rollback operations.

## Scripts

### `health-check.sh` / `health-check.js`

Comprehensive health check script that verifies deployment health after deployment.

**Usage:**

```bash
# Bash version
./scripts/deployment/health-check.sh <backend_url> [frontend_url]

# Node.js version
node scripts/deployment/health-check.js <backend_url> [frontend_url]
```

**Examples:**

```bash
# Check backend only
./scripts/deployment/health-check.sh https://api.example.com

# Check both backend and frontend
./scripts/deployment/health-check.sh https://api.example.com https://app.example.com
```

**What it checks:**

- ✅ Basic health endpoint (`/api/v1/health/`)
- ✅ Readiness check (`/api/v1/health/ready`)
- ✅ Liveness check (`/api/v1/health/live`)
- ✅ Detailed health check (`/api/v1/health/detailed`)
- ✅ Frontend availability (if URL provided)
- ✅ Integration between frontend and backend

**Exit codes:**

- `0` - All health checks passed
- `1` - One or more health checks failed

### `rollback.sh`

Rollback script to revert to previous deployment version.

**Usage:**

```bash
./scripts/deployment/rollback.sh [platform] [service]
```

**Platforms:**

- `railway` - Rollback Railway deployment (default)
- `vercel` - Rollback Vercel deployment
- `git` - Create a Git revert commit

**Services:**

- `all` - Rollback all services (default)
- `frontend` - Rollback frontend only
- `backend` - Rollback backend only

**Examples:**

```bash
# Rollback all services on Railway
./scripts/deployment/rollback.sh railway all

# Rollback only backend
./scripts/deployment/rollback.sh railway backend

# Rollback Vercel deployment
./scripts/deployment/rollback.sh vercel

# Create Git revert commit
./scripts/deployment/rollback.sh git
```

**Requirements:**

- Railway CLI installed (`npm install -g @railway/cli`)
- Railway authentication configured
- Environment variables:
  - `RAILWAY_FRONTEND_SERVICE_ID` (for frontend rollback)
  - `RAILWAY_BACKEND_SERVICE_ID` (for backend rollback)

## Health Check Endpoints

The backend provides several health check endpoints:

### Basic Health Check

```
GET /api/v1/health/
```

Returns basic health status and timestamp.

### Readiness Check

```
GET /api/v1/health/ready
```

Checks if the service is ready to accept traffic. Verifies:

- Database connectivity
- Cache connectivity (optional)

### Liveness Check

```
GET /api/v1/health/live
```

Kubernetes-style liveness probe. Returns if the service is alive.

### Startup Check

```
GET /api/v1/health/startup
```

Kubernetes-style startup probe. Verifies all components are started.

### Detailed Health Check

```
GET /api/v1/health/detailed
```

Comprehensive health check with detailed component status:

- Database connection pool status
- Cache status
- Application information
- Component health breakdown

## Integration with GitHub Actions

These scripts are automatically used in the GitHub Actions deployment workflow (`.github/workflows/deploy.yml`):

1. **After Deployment**: Health checks run automatically
2. **On Failure**: Rollback instructions are provided
3. **Verification**: Comprehensive verification step runs before marking deployment as successful

## Manual Usage

### After Manual Deployment

```bash
# Set your URLs
export BACKEND_URL="https://api.example.com"
export FRONTEND_URL="https://app.example.com"

# Run health checks
./scripts/deployment/health-check.sh $BACKEND_URL $FRONTEND_URL
```

### Manual Rollback

```bash
# Rollback to previous version
./scripts/deployment/rollback.sh railway all

# Verify rollback
./scripts/deployment/health-check.sh $BACKEND_URL $FRONTEND_URL
```

## Troubleshooting

### Health Check Fails

1. **Check service URLs**: Ensure `BACKEND_URL` and `FRONTEND_URL` are correct
2. **Wait longer**: Services may need time to start (default: 30 retries × 5s = 2.5 minutes)
3. **Check logs**: Review deployment logs for errors
4. **Manual verification**: Visit health endpoints directly in browser

### Rollback Fails

1. **Check CLI installation**: Ensure Railway/Vercel CLI is installed
2. **Check authentication**: Verify you're logged in (`railway whoami`)
3. **Check service IDs**: Ensure environment variables are set correctly
4. **Manual rollback**: Use platform dashboard to rollback manually

## Environment Variables

Required for health checks:

- `BACKEND_URL` - Backend API URL
- `FRONTEND_URL` - Frontend application URL (optional)

Required for rollback:

- `RAILWAY_TOKEN` - Railway API token
- `RAILWAY_FRONTEND_SERVICE_ID` - Frontend service ID
- `RAILWAY_BACKEND_SERVICE_ID` - Backend service ID

## Best Practices

1. **Always run health checks** after deployment
2. **Monitor health endpoints** in production
3. **Set up alerts** for health check failures
4. **Test rollback procedures** regularly
5. **Keep deployment history** for easy rollback
6. **Document rollback procedures** for your team
