# 🔧 Troubleshooting Guide

Comprehensive troubleshooting guide for common issues and their solutions.

---

## 📋 Table of Contents

1. [Build & Compilation Issues](#build--compilation-issues)
2. [Runtime Errors](#runtime-errors)
3. [Database Issues](#database-issues)
4. [Authentication Issues](#authentication-issues)
5. [API & Network Issues](#api--network-issues)
6. [Deployment Issues](#deployment-issues)
7. [Performance Issues](#performance-issues)
8. [Environment Variable Issues](#environment-variable-issues)
9. [Sentry & Monitoring Issues](#sentry--monitoring-issues)
10. [Common Error Messages](#common-error-messages)

---

## 🔨 Build & Compilation Issues

### TypeScript Errors

**Error**: `Type error: Property 'x' does not exist on type 'y'`

**Solutions**:

1. Check type definitions in `packages/types`
2. Regenerate types: `pnpm generate:types`
3. Verify imports are correct
4. Check if types are exported correctly

```bash
# Regenerate types from backend
pnpm generate:types

# Type check
pnpm type-check
```

### Build Fails with Module Not Found

**Error**: `Module not found: Can't resolve '@/components/...'`

**Solutions**:

1. Check `tsconfig.json` paths configuration
2. Verify file exists at path
3. Check import statement spelling
4. Restart TypeScript server

```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
pnpm install
pnpm build
```

### Next.js Build Errors

**Error**: `Error occurred prerendering page '/path'`

**Solutions**:

1. Check for server-side only code in client components
2. Verify `'use client'` directive is present
3. Check for missing environment variables
4. Review error stack trace for specific issue

```bash
# Build with verbose output
pnpm build --debug

# Check specific page
pnpm build 2>&1 | grep -A 10 "Error occurred"
```

### Dependency Conflicts

**Error**: `Peer dependency conflicts`

**Solutions**:

1. Clear node_modules and lock file
2. Reinstall dependencies
3. Check for version conflicts

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Check for conflicts
pnpm list --depth=0
```

---

## ⚠️ Runtime Errors

### Hydration Mismatch

**Error**: `Hydration failed because the initial UI does not match what was rendered on the server`

**Solutions**:

1. Check for browser-only APIs used during SSR
2. Use `useEffect` for client-only code
3. Check for conditional rendering based on `window`
4. Verify server and client render the same content

```typescript
// ❌ Bad
const isClient = typeof window !== "undefined";

// ✅ Good
const [isClient, setIsClient] = useState(false);
useEffect(() => {
  setIsClient(true);
}, []);
```

### React Hook Errors

**Error**: `React Hook "useState" is called conditionally`

**Solutions**:

1. Ensure hooks are called at top level
2. Don't call hooks inside conditions/loops
3. Check component structure

```typescript
// ❌ Bad
if (condition) {
  const [state, setState] = useState();
}

// ✅ Good
const [state, setState] = useState();
if (condition) {
  // use state
}
```

### Memory Leaks

**Error**: Application becomes slow over time

**Solutions**:

1. Clean up event listeners
2. Cancel subscriptions
3. Clear intervals/timeouts
4. Unsubscribe from React Query queries

```typescript
useEffect(() => {
  const subscription = subscribe();
  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);
```

---

## 🗄️ Database Issues

### Connection Refused

**Error**: `could not connect to server: Connection refused`

**Solutions**:

1. Verify database is running
2. Check connection string format
3. Verify network/firewall settings
4. Check database credentials

```bash
# Test connection
psql $DATABASE_URL

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

### Migration Errors

**Error**: `alembic.util.exc.CommandError: Can't locate revision identified by 'xxxxx'`

**Solutions**:

1. Check migration history
2. Verify database state matches migrations
3. Reset migrations if needed (development only)

```bash
# Check migration status
alembic current
alembic history

# Upgrade to head
alembic upgrade head

# Downgrade if needed
alembic downgrade -1
```

### Query Timeout

**Error**: `Query timeout after 30 seconds`

**Solutions**:

1. Add database indexes
2. Optimize queries
3. Check for N+1 queries
4. Increase timeout (temporary)

```python
# Add indexes
@event.listens_for(Model, 'after_create')
def create_indexes(target, connection, **kw):
    connection.execute('CREATE INDEX idx_field ON table(field)')
```

### Foreign Key Violations

**Error**: `foreign key constraint fails`

**Solutions**:

1. Check referenced records exist
2. Verify foreign key relationships
3. Check cascade delete settings
4. Review data integrity

---

## 🔐 Authentication Issues

### JWT Token Invalid

**Error**: `Invalid token` or `Token expired`

**Solutions**:

1. Check token expiration settings
2. Verify secret key matches
3. Check token format
4. Clear cookies and re-login

```bash
# Verify secret key
echo $NEXTAUTH_SECRET
echo $SECRET_KEY

# Check token expiration
# ACCESS_TOKEN_EXPIRE_MINUTES should match
```

### CORS Errors

**Error**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:

1. Verify `FRONTEND_URL` is set in backend
2. Check CORS origins configuration
3. Ensure URLs match exactly (including https://)
4. Restart backend after changing CORS settings

```python
# Backend CORS configuration
CORS_ORIGINS = [
    "https://your-frontend.vercel.app",
    "https://your-frontend.railway.app",
]
```

### Session Not Persisting

**Error**: User logged out after page refresh

**Solutions**:

1. Check cookie settings (httpOnly, secure, sameSite)
2. Verify domain settings
3. Check browser cookie settings
4. Verify session storage

```typescript
// Check cookie settings in NextAuth
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
}
```

---

## 🌐 API & Network Issues

### API Request Fails

**Error**: `Failed to fetch` or `Network error`

**Solutions**:

1. Check API URL is correct
2. Verify backend is running
3. Check network connectivity
4. Verify CORS configuration
5. Check browser console for details

```typescript
// Verify API URL
console.log(process.env.NEXT_PUBLIC_API_URL);

// Test API endpoint
fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
  .then((res) => res.json())
  .then(console.log)
  .catch(console.error);
```

### 404 Not Found

**Error**: `404 Not Found` on API endpoint

**Solutions**:

1. Verify endpoint path is correct
2. Check backend routes
3. Verify HTTP method (GET, POST, etc.)
4. Check API version prefix

### 500 Internal Server Error

**Error**: `500 Internal Server Error`

**Solutions**:

1. Check backend logs
2. Verify database connection
3. Check environment variables
4. Review error stack trace
5. Check Sentry for error details

```bash
# Check backend logs
railway logs
# or
docker logs your-backend-container
```

### Timeout Errors

**Error**: `Request timeout` or `ETIMEDOUT`

**Solutions**:

1. Increase timeout settings
2. Optimize slow queries
3. Check network latency
4. Verify server resources

---

## 🚀 Deployment Issues

### Build Fails in Production

**Error**: Build fails on deployment platform

**Solutions**:

1. Check build logs for specific error
2. Verify all `NEXT_PUBLIC_*` variables are set
3. Check Node.js version matches
4. Verify build command is correct
5. Check for memory limits

```bash
# Test build locally
pnpm build

# Check environment variables
env | grep NEXT_PUBLIC
```

### Environment Variables Not Available

**Error**: `process.env.VARIABLE is undefined`

**Solutions**:

1. **Frontend**: Only `NEXT_PUBLIC_*` variables are available
2. Verify variables are set in deployment platform
3. Restart service after adding variables
4. Check variable names (case-sensitive)
5. Verify no typos

```bash
# Check variables in Railway
railway variables

# Check variables in Vercel
vercel env ls
```

### Port Issues

**Error**: `Port already in use` or `EADDRINUSE`

**Solutions**:

1. Railway/Render use `$PORT` automatically
2. Vercel handles ports automatically
3. For Docker, map ports correctly
4. Check if another process is using the port

```bash
# Check port usage
lsof -i :3000
netstat -tulpn | grep 3000
```

### Database Connection in Production

**Error**: Cannot connect to database

**Solutions**:

1. Verify `DATABASE_URL` is correct
2. Check database is accessible from platform
3. Verify SSL mode if required
4. Check firewall/network settings
5. Verify database credentials

```bash
# Test database connection
psql $DATABASE_URL

# Check SSL mode
DATABASE_URL="postgresql://...?sslmode=require"
```

---

## ⚡ Performance Issues

### Slow Page Loads

**Symptoms**: Pages take too long to load

**Solutions**:

1. Check bundle size: `pnpm analyze`
2. Enable code splitting
3. Optimize images
4. Check API response times
5. Review database queries

```bash
# Analyze bundle
pnpm analyze

# Check performance
pnpm dev
# Open Chrome DevTools → Performance tab
```

### High Memory Usage

**Symptoms**: Application uses too much memory

**Solutions**:

1. Check for memory leaks
2. Optimize image loading
3. Reduce bundle size
4. Check for unnecessary re-renders
5. Review React Query cache settings

### Slow API Responses

**Symptoms**: API calls are slow

**Solutions**:

1. Add database indexes
2. Optimize queries (avoid N+1)
3. Enable query caching
4. Check database performance
5. Review API endpoint logic

```python
# Add indexes
class User(Base):
    __tablename__ = "users"
    email = Column(String, index=True)  # Add index
```

---

## 🔧 Environment Variable Issues

### Variables Not Loading

**Error**: Environment variables are undefined

**Solutions**:

1. **Frontend**: Use `NEXT_PUBLIC_` prefix for client-side
2. Restart dev server after changing `.env.local`
3. Verify `.env.local` exists and is in correct location
4. Check for typos in variable names
5. Verify no spaces around `=`

```bash
# Check .env.local exists
ls -la apps/web/.env.local

# Verify variables
cat apps/web/.env.local | grep NEXT_PUBLIC
```

### Wrong Environment Values

**Error**: Using development values in production

**Solutions**:

1. Verify environment variables in deployment platform
2. Check `.env.local` is not committed
3. Use different variables for each environment
4. Verify `NODE_ENV` is set correctly

```bash
# Check current environment
echo $NODE_ENV

# Verify production variables
railway variables | grep ENVIRONMENT
```

---

## 📊 Sentry & Monitoring Issues

### Errors Not Appearing in Sentry

**Error**: Errors not showing in Sentry dashboard

**Solutions**:

1. Verify DSN is correct
2. Check `SENTRY_ENABLE_DEV` if testing in development
3. Verify Sentry is initialized
4. Check browser console for Sentry errors
5. Verify CSP allows Sentry domains

```bash
# Check Sentry DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# Test Sentry
# Visit /test-sentry page
```

### Performance Metrics Not Showing

**Error**: Performance data not in Sentry

**Solutions**:

1. Wait a few minutes (metrics take time)
2. Check `tracesSampleRate` is > 0
3. Verify Web Vitals are being tracked
4. Check Sentry Performance tab (not just Issues)

### Too Many Errors

**Error**: Sentry flooded with errors

**Solutions**:

1. Configure error filtering in Sentry config
2. Adjust sampling rates
3. Filter out known non-critical errors
4. Set up error grouping rules

---

## 🐛 Common Error Messages

### `NEXT_PUBLIC_API_URL is required`

**Cause**: API URL not set

**Solution**:

```bash
# Add to .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000

# Or in production
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### `Invalid API response`

**Cause**: Backend returning unexpected format

**Solution**:

1. Check backend response format
2. Verify API endpoint is correct
3. Check network tab in DevTools
4. Review API client code

### `Database connection pool exhausted`

**Cause**: Too many database connections

**Solution**:

1. Increase connection pool size
2. Close connections properly
3. Check for connection leaks
4. Restart backend service

```python
# Increase pool size
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
)
```

### `Module not found: '@/lib/...'`

**Cause**: Path alias not resolving

**Solution**:

1. Check `tsconfig.json` paths
2. Verify file exists
3. Restart TypeScript server
4. Clear `.next` cache

---

## 🔍 Debugging Tips

### Enable Debug Logging

```bash
# Frontend
DEBUG=* pnpm dev

# Backend
LOG_LEVEL=DEBUG uvicorn app.main:app --reload
```

### Check Logs

```bash
# Railway
railway logs

# Docker
docker logs container-name

# Local
pnpm dev 2>&1 | tee debug.log
```

### Network Debugging

1. Open Chrome DevTools → Network tab
2. Check request/response headers
3. Verify CORS headers
4. Check for failed requests
5. Review response status codes

### Database Debugging

```bash
# Connect to database
psql $DATABASE_URL

# Check tables
\dt

# Check indexes
\di

# Run query
SELECT * FROM users LIMIT 10;
```

---

## 📞 Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review error logs
3. ✅ Check Sentry for error details
4. ✅ Verify environment variables
5. ✅ Test in development environment

### Provide When Reporting Issues

1. **Error Message**: Full error text
2. **Stack Trace**: Complete stack trace
3. **Environment**: Development/Production
4. **Steps to Reproduce**: What you did
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **Logs**: Relevant log output
8. **Configuration**: Relevant config files

### Resources

- [GitHub Issues](https://github.com/your-username/your-repo-name/issues)
- [Documentation](./README.md)
- [Sentry Dashboard](https://sentry.io) (for production errors)
- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

---

## ✅ Quick Fixes Checklist

When something breaks, try these in order:

- [ ] Restart development server
- [ ] Clear `.next` cache: `rm -rf .next`
- [ ] Reinstall dependencies: `rm -rf node_modules && pnpm install`
- [ ] Check environment variables
- [ ] Verify database connection
- [ ] Check browser console for errors
- [ ] Review backend logs
- [ ] Check Sentry for error details
- [ ] Verify CORS configuration
- [ ] Check network connectivity

---

**Last Updated**: 2025-01-25
