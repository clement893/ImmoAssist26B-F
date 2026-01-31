# Monitoring Setup Summary

This document summarizes the monitoring and error tracking setup for the application.

## ✅ What's Been Set Up

### 1. Sentry Error Tracking

- ✅ Sentry package installed (`@sentry/nextjs`)
- ✅ Configuration files created:
  - `instrumentation-client.ts` - Client-side error tracking
  - `sentry.server.config.ts` - Server-side error tracking
  - `sentry.edge.config.ts` - Edge runtime error tracking
- ✅ Automatic error capture via Error Boundary
- ✅ Performance monitoring integration
- ✅ Session replay (optional, minimal sampling)

### 2. Error Boundary Component

- ✅ `ErrorBoundary.tsx` - Catches React errors and reports to Sentry
- ✅ Integrated into root layout
- ✅ User-friendly error UI with retry options
- ✅ Error ID display for support

### 3. Error Tracking Dashboard

- ✅ `/monitoring/errors` - Error tracking dashboard
- ✅ Real-time error statistics
- ✅ Recent error logs
- ✅ Error categorization (critical, warning, info)
- ✅ Local storage fallback for client-side errors

### 4. Performance Monitoring

- ✅ Web Vitals integration with Sentry
- ✅ Core Web Vitals tracking (LCP, INP, CLS, FCP, TTFB, FID)
- ✅ Performance dashboard at `/monitoring/performance`
- ✅ Real-time performance metrics
- ✅ Performance ratings (good/needs-improvement/poor)
- ✅ Automatic poor performance alerts

### 5. Monitoring Utilities

- ✅ `lib/monitoring/sentry.ts` - Sentry helper functions
  - `setUserContext()` - Set user information
  - `captureException()` - Capture errors
  - `captureMessage()` - Capture messages
  - `addBreadcrumb()` - Add debugging breadcrumbs
  - `trackPerformanceMetric()` - Track custom metrics
  - `trackEvent()` - Track custom events

### 6. Error Reporting Component

- ✅ `ErrorReporting.tsx` - User-facing error report form
- ✅ Integrated with Sentry
- ✅ Collects detailed error information
- ✅ Supports screenshots and console logs

## 📋 Next Steps

### 1. Configure Sentry DSN

Add your Sentry DSN to `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development
```

See `SENTRY_SETUP.md` for detailed instructions.

### 2. Test Error Tracking

1. Start the development server
2. Navigate to `/monitoring/errors`
3. Trigger a test error (you can use the error boundary)
4. Check Sentry dashboard for the error

### 3. Test Performance Monitoring

1. Navigate to `/monitoring/performance`
2. View real-time Web Vitals metrics
3. Check Sentry dashboard for performance data

### 4. Customize Configuration

- Adjust sampling rates in Sentry config files
- Customize error filtering in `beforeSend` callbacks
- Configure session replay sampling (if needed)

## 📊 Dashboard URLs

- **Error Tracking**: `/monitoring/errors`
- **Performance Monitoring**: `/monitoring/performance`

## 🔧 Usage Examples

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
});
```

## 📚 Documentation

- **Sentry Setup**: See `SENTRY_SETUP.md`
- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Web Vitals**: https://web.dev/vitals/

## 🎯 Features

### Error Tracking

- ✅ Automatic error capture
- ✅ Manual error reporting
- ✅ User context tracking
- ✅ Breadcrumb logging
- ✅ Error categorization
- ✅ Error dashboard UI

### Performance Monitoring

- ✅ Core Web Vitals tracking
- ✅ Custom performance metrics
- ✅ Performance alerts
- ✅ Performance dashboard UI
- ✅ Real-time metrics display

### User Experience

- ✅ Error boundaries with retry
- ✅ User-friendly error messages
- ✅ Error reporting form
- ✅ Performance insights

## 🚀 Production Checklist

Before deploying to production:

- [ ] Set `SENTRY_ENVIRONMENT=production`
- [ ] Set `SENTRY_RELEASE` to your app version
- [ ] Verify DSN is set correctly
- [ ] Test error tracking in staging
- [ ] Test performance monitoring
- [ ] Review sampling rates (10% default)
- [ ] Configure alert rules in Sentry
- [ ] Set up Sentry notifications

## 🆘 Troubleshooting

### Errors Not Appearing

1. Check DSN is set correctly
2. Verify `SENTRY_ENABLE_DEV=true` in development
3. Check browser console for errors
4. Verify CSP allows Sentry domains

### Performance Metrics Not Showing

1. Ensure Web Vitals are being tracked
2. Check Sentry initialization
3. Verify `tracesSampleRate` > 0

For more details, see `SENTRY_SETUP.md`.
