# i18n Components

Internationalization and localization components with RTL support.

## 📦 Components

- **LanguageSwitcher** - Language switcher dropdown (uses window.location)
- **LocaleSwitcher** - Alternative locale switcher (uses Next.js router)
- **RTLProvider** - Right-to-left layout provider for Arabic/Hebrew

## 📖 Usage Examples

### Language Switcher

```tsx
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

<LanguageSwitcher />;
```

### RTL Provider

```tsx
import RTLProvider from '@/components/i18n/RTLProvider';

<RTLProvider>
  <YourContent />
</RTLProvider>;
```

## 🌍 Supported Locales

- **LTR**: English (en), French (fr)
- **RTL**: Arabic (ar), Hebrew (he)

## 🔗 Related

- [i18n Components Showcase](/components/i18n)
- [i18n Setup Guide](../../docs/I18N_SETUP.md)
