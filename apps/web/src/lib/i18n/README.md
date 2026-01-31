# Support i18n (Multi-langue)

Support optionnel pour les traductions multi-langues.

## 🚀 Utilisation

### Dans un composant

```tsx
import { useTranslations } from '@/lib/i18n/hooks';

export default function MyComponent() {
  const t = useTranslations('common');

  return <h1>{t.welcome}</h1>;
}
```

### Changer de langue

```tsx
import LocaleSwitcher from '@/components/i18n/LocaleSwitcher';

export default function Header() {
  return (
    <header>
      <LocaleSwitcher />
    </header>
  );
}
```

## 📝 Ajouter une nouvelle langue

1. Ajouter la locale dans `config.ts`:

```typescript
export const supportedLocales = ['fr', 'en', 'es', 'de'] as const;
```

2. Ajouter les traductions dans `messages.ts`:

```typescript
de: {
  common: { ... },
  auth: { ... },
}
```

## 🔧 Configuration

Les langues supportées sont définies dans `config.ts`. La langue par défaut est le français.

## 📚 Intégration Next.js

Pour une intégration complète avec Next.js App Router, considérez l'utilisation de `next-intl` ou `next-i18next`.
