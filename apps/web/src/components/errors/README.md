# Error Components

Error handling, display, and reporting components.

## 📦 Components

- **ErrorBoundary** - React error boundary with Sentry integration
- **ErrorDisplay** - Reusable error display component
- **ErrorReporting** - User-friendly error reporting form
- **ApiError** - API error handler with retry functionality

## 📖 Usage Examples

### Error Boundary

```tsx
import { ErrorBoundary } from '@/components/errors';

<ErrorBoundary showDetails>
  <MyComponent />
</ErrorBoundary>;
```

### Error Display

```tsx
import { ErrorDisplay } from '@/components/errors';

<ErrorDisplay error={error} code="FETCH_ERROR" statusCode={404} onRetry={() => handleRetry()} />;
```

### Error Reporting

```tsx
import ErrorReporting from '@/components/errors/ErrorReporting';

<ErrorReporting
  onSubmit={async (data) => {
    await reportError(data);
  }}
/>;
```

## 🔗 Related

- [Error Components Showcase](/components/errors)
- [Sentry Integration](../../docs/SENTRY.md)
