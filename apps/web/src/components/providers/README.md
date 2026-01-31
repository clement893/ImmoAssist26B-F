# Providers Components

React context providers for application-wide configuration and state management.

## 📦 Components

- **AppProviders** - Combined app providers (recommended)
- **QueryProvider** - React Query provider
- **SessionProvider** - NextAuth session provider
- **ThemeManagerProvider** - Theme management provider
- **GlobalErrorHandler** - Global error boundary

## 📖 Usage Examples

### App Providers (Recommended)

```tsx
import { AppProviders } from '@/components/providers';

export default function RootLayout({ children }) {
  return <AppProviders>{children}</AppProviders>;
}
```

### Individual Providers

```tsx
import { QueryProvider, SessionProvider, ThemeManagerProvider } from '@/components/providers';

<QueryProvider>
  <SessionProvider>
    <ThemeManagerProvider>{children}</ThemeManagerProvider>
  </SessionProvider>
</QueryProvider>;
```

## 🎨 Features

- **Combined Provider**: Single provider component reduces nesting
- **React Query**: Data fetching and caching
- **Session Management**: User session handling
- **Theme Management**: Theme switching and persistence
- **Error Handling**: Global error boundary
- **Performance**: Optimized to reduce re-renders

## 🔧 Configuration

### AppProviders

- `children`: React children
- Automatically includes all necessary providers

### QueryProvider

- Uses React Query for data fetching
- Includes React Query DevTools in development

### SessionProvider

- NextAuth session provider
- Handles authentication state

### ThemeManagerProvider

- Manages theme state
- Persists theme preferences

## 🔗 Related Components

- See `/components/theme` for theme components
- See `/lib/theme` for theme utilities
