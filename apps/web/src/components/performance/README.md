# Performance Components

Components for performance monitoring, optimization, and web vitals tracking.

## 📦 Components

- **OfflineSupport** - Offline functionality and caching
- **OptimisticUpdates** - Optimistic UI updates
- **OptimizationDashboard** - Performance optimization dashboard
- **PerformanceScripts** - Performance optimization scripts
- **WebVitalsReporter** - Web vitals metrics reporter

## 📖 Usage Examples

### Offline Support

```tsx
import { OfflineSupport } from '@/components/performance';

<OfflineSupport onOnline={() => handleOnline()} onOffline={() => handleOffline()} />;
```

### Optimistic Updates

```tsx
import { OptimisticUpdates } from '@/components/performance';

<OptimisticUpdates
  onUpdate={async (data) => await updateData(data)}
  onRollback={() => handleRollback()}
/>;
```

### Optimization Dashboard

```tsx
import { OptimizationDashboard } from '@/components/performance';

<OptimizationDashboard metrics={performanceMetrics} />;
```

### Web Vitals Reporter

```tsx
import { WebVitalsReporter } from '@/components/performance';

<WebVitalsReporter onReport={(metrics) => handleReport(metrics)} />;
```

## 🎨 Features

- **Offline Support**: Service worker and caching
- **Optimistic UI**: Instant UI updates
- **Performance Metrics**: Track Core Web Vitals
- **Bundle Analysis**: Analyze bundle sizes
- **Lazy Loading**: Lazy load components
- **Code Splitting**: Automatic code splitting

## 🔧 Configuration

### OfflineSupport

- `onOnline`: Online callback
- `onOffline`: Offline callback
- `cacheStrategy`: Caching strategy

### OptimisticUpdates

- `onUpdate`: Update callback
- `onRollback`: Rollback callback

### OptimizationDashboard

- `metrics`: Performance metrics object

### WebVitalsReporter

- `onReport`: Metrics report callback
- `sampleRate`: Sampling rate (0-1)

## 🔗 Related Components

- See `/components/monitoring` for monitoring components
- See `/components/ui` for base UI components
