# Sentry Setup Guide

This guide will help you set up Sentry for error tracking and performance monitoring in your Next.js application.

## Prerequisites

1. A Sentry account (sign up at https://sentry.io if you don't have one)
2. A Sentry project created in your organization

## Step 1: Get Your Sentry DSN

1. Log in to your Sentry account
2. Navigate to **Settings** → **Projects** → Select your project
3. Go to **Client Keys (DSN)**
4. Copy your DSN (it looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

## Step 2: Configure Environment Variables

Add the following to your `.env.local` file (or `.env` for production):

```env
# Sentry Error Tracking & Performance Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
SENTRY_ENVIRONMENT=development  # or 'production', 'staging', etc.
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
SENTRY_RELEASE=1.0.0  # Optional: version/release identifier
NEXT_PUBLIC_SENTRY_RELEASE=1.0.0

# Enable Sentry in development (set to 'true' to enable)
SENTRY_ENABLE_DEV=false
NEXT_PUBLIC_SENTRY_ENABLE_DEV=false

# Enable Sentry debug mode (set to 'true' for verbose logging)
SENTRY_DEBUG=false
```

**Important Notes:**

- Use `NEXT_PUBLIC_SENTRY_DSN` for client-side tracking
- Use `SENTRY_DSN` for server-side tracking
- Set `SENTRY_ENABLE_DEV=true` only if you want to track errors in development
- In production, Sentry will automatically track errors

## Step 3: Verify Installation

The Sentry package (`@sentry/nextjs`) is already installed. The configuration files are located at:

- `instrumentation-client.ts` - Client-side configuration
- `sentry.server.config.ts` - Server-side configuration
- `sentry.edge.config.ts` - Edge runtime configuration

## Step 4: Test Error Tracking

1. Start your development server:

   ```bash
   pnpm dev
   ```

2. Navigate to a page and trigger a test error (you can use the error boundary test)

3. Check your Sentry dashboard - you should see the error appear within a few seconds

## Step 5: Access Monitoring Dashboards

The application includes built-in monitoring dashboards:

- **Error Tracking Dashboard**: `/monitoring/errors`
- **Performance Dashboard**: `/monitoring/performance`

These dashboards provide:

- Real-time error statistics
- Performance metrics (Core Web Vitals)
- Recent error logs
- Performance ratings and recommendations

## Features Included

### ✅ Error Tracking

- Automatic error capture via Error Boundary
- Manual error reporting via `captureException()`
- User context tracking
- Breadcrumb logging

### ✅ Performance Monitoring

- Core Web Vitals tracking (LCP, INP, CLS, FCP, TTFB)
- Automatic performance metric collection
- Poor performance alerts
- Performance dashboard UI

### ✅ Session Replay (Optional)

- Session replay is configured but uses minimal sampling by default
- Adjust `replaysSessionSampleRate` in `instrumentation-client.ts` if needed

## Usage Examples

### Capture an Error

```typescript
import { captureException } from '@/lib/monitoring/sentry';

try {
  // Your code
} catch (error) {
  captureException(error, {
    tags: { component: 'checkout' },
    extra: { userId: '123' },
  });
}
```

### Track Performance

```typescript
import { trackPerformanceMetric } from '@/lib/monitoring/sentry';

trackPerformanceMetric('api.request.duration', 150, 'millisecond', {
  endpoint: '/api/users',
});
```

### Set User Context

```typescript
import { setUserContext } from '@/lib/monitoring/sentry';

setUserContext({
  id: 'user-123',
  email: 'user@example.com',
  username: 'johndoe',
});
```

### Add Breadcrumbs

```typescript
import { addBreadcrumb } from '@/lib/monitoring/sentry';

addBreadcrumb('User clicked checkout button', 'user-action', 'info', {
  page: '/checkout',
  timestamp: Date.now(),
});
```

## Configuration Options

### Sampling Rates

By default, the configuration uses:

- **Production**: 10% of transactions sampled
- **Development**: 100% of transactions sampled

You can adjust these in the Sentry config files:

- `tracesSampleRate` - Controls performance monitoring sampling
- `replaysSessionSampleRate` - Controls session replay sampling
- `replaysOnErrorSampleRate` - Always records sessions with errors (100%)

### Error Filtering

The configuration includes automatic filtering for:

- Network errors (likely user-related)
- ResizeObserver errors (browser quirks)
- Development mode errors (unless explicitly enabled)

You can customize filtering in the `beforeSend` callback in each config file.

## Production Deployment

1. Set `SENTRY_ENVIRONMENT=production` in your production environment
2. Set `SENTRY_RELEASE` to your application version (e.g., `1.0.0`)
3. Ensure `NEXT_PUBLIC_SENTRY_DSN` and `SENTRY_DSN` are set
4. Set `SENTRY_ENABLE_DEV=false` (or omit it)

## Troubleshooting

### Errors Not Appearing in Sentry

1. Check that your DSN is correctly set in environment variables
2. Verify `SENTRY_ENABLE_DEV=true` if testing in development
3. Check browser console for Sentry initialization errors
4. Verify CSP headers allow Sentry domains (already configured in `next.config.js`)

### Performance Metrics Not Showing

1. Ensure Web Vitals are being tracked (check browser console)
2. Verify Sentry is initialized correctly
3. Check that `tracesSampleRate` is not set to 0

### Session Replay Not Working

1. Check that `replaysSessionSampleRate` is greater than 0
2. Verify browser compatibility (modern browsers only)
3. Check Sentry project settings for session replay availability

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)

## Support

For issues or questions:

1. Check the Sentry dashboard for error details
2. Review the configuration files in the project root
3. Consult Sentry's official documentation
