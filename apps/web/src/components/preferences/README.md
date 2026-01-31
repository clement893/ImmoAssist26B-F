# Preferences Components

Components for managing user preferences and settings.

## 📦 Components

- **PreferencesManager** - Manage user preferences

## 📖 Usage Examples

### Preferences Manager

```tsx
import { PreferencesManager } from '@/components/preferences';

<PreferencesManager
  preferences={userPreferences}
  onSave={async (preferences) => await savePreferences(preferences)}
/>;
```

## 🎨 Features

- **User Preferences**: Manage user-specific preferences
- **Theme Preferences**: Light/dark mode preferences
- **Notification Preferences**: Notification settings
- **Language Preferences**: Language and locale settings
- **Accessibility**: Accessibility preferences
- **Data Persistence**: Save preferences to backend

## 🔧 Configuration

### PreferencesManager

- `preferences`: User preferences object
- `onSave`: Save callback
- `categories`: Preference categories to display

## 🔗 Related Components

- See `/components/settings` for settings components
- See `/components/ui` for base UI components
