# 🌍 Internationalization (i18n) Setup Guide

Complete guide for using internationalization with next-intl, including RTL support.

---

## 📋 Overview

This project uses **next-intl** for internationalization, supporting:

- ✅ **4 Languages**: English (en), French (fr), Arabic (ar), Hebrew (he)
- ✅ **RTL Support**: Full right-to-left support for Arabic and Hebrew
- ✅ **Language Switcher**: Easy language switching component
- ✅ **Automatic Locale Detection**: Detects user's preferred language
- ✅ **SEO Friendly**: Proper locale routing and meta tags

---

## 🚀 Quick Start

### Using Translations

```tsx
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("common");

  return <h1>{t("welcome")}</h1>;
}
```

### Using Language Switcher

```tsx
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";

export default function Header() {
  return (
    <header>
      <LocaleSwitcher />
    </header>
  );
}
```

---

## 📁 File Structure

```
apps/web/
├── messages/              # Translation files
│   ├── en.json           # English translations
│   ├── fr.json           # French translations
│   ├── ar.json           # Arabic translations
│   └── he.json           # Hebrew translations
├── src/
│   ├── i18n/
│   │   ├── routing.ts    # Locale configuration
│   │   └── request.ts    # next-intl request config
│   └── components/
│       └── i18n/
│           ├── LanguageSwitcher.tsx
│           └── RTLProvider.tsx
└── src/app/
    └── [locale]/         # Locale-based routes
        ├── layout.tsx
        └── page.tsx
```

---

## 🔧 Configuration

### Supported Locales

Defined in `src/i18n/routing.ts`:

```typescript
export const locales = ["en", "fr", "ar", "he"] as const;
export const defaultLocale = "en";
export const rtlLocales = ["ar", "he"];
```

### Adding a New Locale

1. **Add locale to routing**:

   ```typescript
   // src/i18n/routing.ts
   export const locales = ["en", "fr", "ar", "he", "es"] as const;
   ```

2. **Create translation file**:

   ```bash
   # Create messages/es.json
   ```

3. **Add locale names**:

   ```typescript
   export const localeNames = {
     // ...
     es: "Español",
   };
   ```

4. **Update RTL locales** (if RTL):
   ```typescript
   export const rtlLocales = ["ar", "he", "ur"]; // Add Urdu if needed
   ```

---

## 📝 Translation Files

### Structure

Translation files are JSON files in `messages/` directory:

```json
{
  "common": {
    "welcome": "Welcome",
    "save": "Save",
    "cancel": "Cancel"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out"
  }
}
```

### Nested Translations

```json
{
  "user": {
    "profile": {
      "title": "Profile",
      "edit": "Edit Profile"
    }
  }
}
```

Access with: `t('user.profile.title')`

---

## 🎨 Using Translations

### In Server Components

```tsx
import { getTranslations } from "next-intl/server";

export default async function ServerComponent() {
  const t = await getTranslations("common");

  return <h1>{t("welcome")}</h1>;
}
```

### In Client Components

```tsx
"use client";

import { useTranslations } from "next-intl";

export default function ClientComponent() {
  const t = useTranslations("common");

  return <button>{t("save")}</button>;
}
```

### With Parameters

```tsx
// Translation file
{
  "greeting": "Hello, {name}!"
}

// Component
const t = useTranslations('common');
t('greeting', { name: 'John' }); // "Hello, John!"
```

### With Rich Text

```tsx
// Translation file
{
  "welcome": "Welcome to <strong>our app</strong>!"
}

// Component
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
<div dangerouslySetInnerHTML={{ __html: t.rich('welcome') }} />
```

---

## 🔄 Language Switcher

### Basic Usage

```tsx
import LocaleSwitcher from "@/components/i18n/LocaleSwitcher";

export default function Header() {
  return (
    <header>
      <LocaleSwitcher />
    </header>
  );
}
```

### Custom Language Switcher

```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { locales, localeNames } from "@/i18n/routing";

export default function CustomSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  return (
    <select value={locale} onChange={(e) => router.push(`/${e.target.value}`)}>
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
```

---

## ➡️ RTL Support

### Automatic RTL

RTL is automatically applied for Arabic and Hebrew locales via `RTLProvider`.

### Manual RTL Check

```tsx
import { isRTL } from "@/i18n/routing";
import { useLocale } from "next-intl";

export default function Component() {
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);

  return <div dir={rtl ? "rtl" : "ltr"}>{/* Content */}</div>;
}
```

### RTL CSS Utilities

The project includes RTL-aware CSS utilities:

```css
/* Automatically reversed in RTL */
[dir="rtl"] .text-left {
  text-align: right;
}
[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}
[dir="rtl"] .ml-auto {
  margin-right: auto;
}
```

### RTL-Aware Components

When building components, use:

```tsx
import { useLocale } from "next-intl";
import { isRTL } from "@/i18n/routing";

export default function Component() {
  const locale = useLocale();
  const rtl = isRTL(locale as Locale);

  return (
    <div className={rtl ? "text-right" : "text-left"}>{/* Content */}</div>
  );
}
```

---

## 🛣️ Routing

### Navigation with Locale

```tsx
import { Link } from '@/i18n/routing';

// Automatically includes current locale
<Link href="/dashboard">Dashboard</Link>

// Explicit locale
<Link href="/dashboard" locale="fr">Tableau de bord</Link>
```

### Programmatic Navigation

```tsx
import { useRouter } from "@/i18n/routing";

const router = useRouter();
router.push("/dashboard"); // Uses current locale
router.push("/dashboard", { locale: "fr" }); // Explicit locale
```

### Getting Current Locale

```tsx
import { useLocale } from "next-intl";

const locale = useLocale(); // 'en', 'fr', 'ar', or 'he'
```

---

## 📊 URL Structure

### Default Locale (English)

- `/` → English homepage
- `/dashboard` → English dashboard
- `/auth/login` → English login

### Other Locales

- `/fr` → French homepage
- `/fr/dashboard` → French dashboard
- `/ar/auth/login` → Arabic login
- `/he/settings` → Hebrew settings

---

## 🔍 Locale Detection

The middleware automatically:

1. Detects locale from URL
2. Falls back to browser language
3. Uses default locale if no match

### Custom Detection

```typescript
// src/i18n/request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Custom detection logic
  if (!locale) {
    // Check cookie, header, etc.
    locale = getLocaleFromCookie();
  }

  return {
    locale: locale || "en",
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

---

## 🎯 Best Practices

### 1. Organize Translations

Group related translations:

```json
{
  "auth": {
    "login": { ... },
    "register": { ... }
  },
  "dashboard": {
    "overview": { ... },
    "settings": { ... }
  }
}
```

### 2. Use Namespaces

```tsx
// Instead of
const t = useTranslations();
t("auth.login.title");

// Use namespaces
const t = useTranslations("auth.login");
t("title");
```

### 3. Keep Keys Consistent

Use consistent naming:

- `title`, `description`, `button`, `label`
- `error`, `success`, `warning`
- `save`, `cancel`, `delete`, `edit`

### 4. Test RTL Layouts

Always test components in RTL mode:

- Switch to Arabic or Hebrew
- Verify layout looks correct
- Check text alignment
- Test navigation flow

### 5. Handle Missing Translations

```tsx
// Translation file
{
  "welcome": "Welcome"
}

// Component
const t = useTranslations('common');
t('welcome'); // "Welcome"
t('goodbye', { defaultValue: 'Goodbye' }); // "Goodbye" (fallback)
```

---

## 🐛 Troubleshooting

### Translations Not Showing

1. **Check translation file exists**: `messages/{locale}.json`
2. **Verify namespace**: `useTranslations('correct-namespace')`
3. **Check key spelling**: Case-sensitive
4. **Restart dev server**: After adding translations

### RTL Not Working

1. **Verify locale is RTL**: Check `rtlLocales` array
2. **Check RTLProvider**: Ensure it's in layout
3. **Verify CSS**: Check `globals.css` for RTL styles
4. **Clear cache**: Hard refresh browser

### Locale Not Changing

1. **Check middleware**: Verify middleware is running
2. **Check routing config**: Verify locale is in `locales` array
3. **Check URL structure**: Ensure locale prefix is correct
4. **Clear browser cache**: May cache old routes

---

## 📚 Additional Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [RTL Best Practices](https://rtlstyling.com/)
- [Internationalization Guide](https://nextjs.org/docs/app/building-your-application/routing/internationalization)

---

**Last Updated**: 2025-01-25
