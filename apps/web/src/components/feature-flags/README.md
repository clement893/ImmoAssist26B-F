# Feature Flags Components

Components for managing feature flags and toggling features.

## 📦 Components

- **FeatureFlagManager** - Manage feature flags and their states

## 📖 Usage Examples

### Feature Flag Manager

```tsx
import { FeatureFlagManager } from '@/components/feature-flags';

<FeatureFlagManager
  flags={featureFlags}
  onFlagToggle={async (flagId, enabled) => await toggleFlag(flagId, enabled)}
/>;
```

## 🎨 Features

- **Flag Management**: Create, update, and delete feature flags
- **Toggle States**: Enable/disable features
- **User Targeting**: Target flags to specific users or groups
- **Percentage Rollout**: Gradual rollout percentages
- **A/B Testing**: Support for A/B testing scenarios
- **Audit Trail**: Track flag changes

## 🔧 Configuration

### FeatureFlagManager

- `flags`: Array of feature flag objects
- `onFlagToggle`: Toggle callback
- `onFlagCreate`: Create callback
- `onFlagUpdate`: Update callback

## 🔗 Related Components

- See `/components/rbac` for role-based access control
- See `/components/ui` for base UI components
