# 🔄 Guide de Migration vers les Packages Modulaires

Ce guide explique comment migrer progressivement le code existant vers les nouveaux packages modulaires.

## 📦 Packages Disponibles

### @immoassist/ui
Composants UI et hooks partagés.

### @immoassist/reseau
Types et API pour le module Réseau (contacts réseau).

### @immoassist/transactions
Types et API pour le module Transactions.

### @immoassist/config
Configuration partagée (ESLint, TypeScript, Tailwind).

---

## 🔄 Migration des Imports

### Avant (ancien code)

```typescript
// Composants UI
import { Button, Card, Input } from '@/components/ui';
import { useForm, usePagination } from '@/hooks';

// API
import { reseauContactsAPI } from '@/lib/api/reseau-contacts';
import { transactionsAPI } from '@/lib/api';
```

### Après (nouveau code)

```typescript
// Composants UI depuis le package
import { Button, Card, Input } from '@immoassist/ui';
import { useForm, usePagination } from '@immoassist/ui/hooks';

// API via les adaptateurs (temporaire)
import { reseauContactsAPI } from '@/lib/api/reseau-adapters';
import { transactionsAPI } from '@/lib/api/transactions-adapters';
```

---

## 📝 Exemples de Migration

### Exemple 1 : Formulaire avec useForm

**Avant** :
```typescript
import { useForm } from '@/hooks/forms/useForm';
import { Button, Input } from '@/components/ui';

function MyForm() {
  const { values, handleSubmit } = useForm({
    onSubmit: async (data) => {
      // ...
    },
  });
  // ...
}
```

**Après** :
```typescript
import { useForm } from '@immoassist/ui/hooks';
import { Button, Input } from '@immoassist/ui';

function MyForm() {
  const { values, handleSubmit } = useForm({
    onSubmit: async (data) => {
      // ...
    },
  });
  // ...
}
```

### Exemple 2 : Liste avec Pagination

**Avant** :
```typescript
import { usePagination } from '@/hooks/data/usePagination';
import { Card, Button } from '@/components/ui';

function MyList() {
  const pagination = usePagination({
    totalItems: 100,
    pageSize: 10,
  });
  // ...
}
```

**Après** :
```typescript
import { usePagination } from '@immoassist/ui/hooks';
import { Card, Button } from '@immoassist/ui';

function MyList() {
  const pagination = usePagination({
    totalItems: 100,
    pageSize: 10,
  });
  // ...
}
```

### Exemple 3 : Composants UI

**Avant** :
```typescript
import { Button, Card, Input, Alert } from '@/components/ui';
```

**Après** :
```typescript
import { Button, Card, Input, Alert } from '@immoassist/ui';
```

---

## 🎯 Stratégie de Migration

### Phase 1 : Migration Progressive (Recommandée)

1. **Créer des alias** dans `apps/web/tsconfig.json` pour faciliter la transition :
```json
{
  "paths": {
    "@ui": ["../../packages/ui/src"],
    "@ui/*": ["../../packages/ui/src/*"]
  }
}
```

2. **Migrer fichier par fichier** :
   - Commencer par les nouveaux fichiers
   - Migrer progressivement les fichiers existants
   - Tester après chaque migration

3. **Maintenir la compatibilité** :
   - Les anciens imports continuent de fonctionner
   - Migrer progressivement sans casser le code existant

### Phase 2 : Migration Complète

Une fois tous les composants migrés :
1. Supprimer les anciens fichiers de `apps/web/src/components/ui/`
2. Mettre à jour tous les imports
3. Vérifier que tout fonctionne

---

## ✅ Checklist de Migration

Pour chaque fichier à migrer :

- [ ] Identifier les imports à changer
- [ ] Remplacer les imports
- [ ] Vérifier que les types sont corrects
- [ ] Tester le composant/page
- [ ] Vérifier le build
- [ ] Vérifier le type-check

---

## 🚨 Points d'Attention

### 1. Composants avec Dépendances Spécifiques

Certains composants utilisent des hooks/thèmes spécifiques à l'app. Ces composants :
- Restent dans `apps/web/src/components/ui/` pour l'instant
- Seront migrés plus tard avec une refactorisation

### 2. Types et Interfaces

Les types sont maintenant dans les packages :
- `@immoassist/ui` → Types des composants UI
- `@immoassist/reseau` → Types du module Réseau
- `@immoassist/transactions` → Types du module Transactions

### 3. Configuration

La configuration partagée est dans `@immoassist/config` :
- ESLint, TypeScript, Tailwind
- Peut être étendue par les apps

---

## 📚 Ressources

- [Documentation Phase 1](./IMPLEMENTATION_SUMMARY.md)
- [Documentation Phase 2](./PHASE2_IMPLEMENTATION.md)
- [Meilleures Pratiques](./TURBOREPO_BEST_PRACTICES.md)
- [Roadmap Architecture](./ARCHITECTURE_ROADMAP.md)

---

## 🎉 Résultat

Une fois la migration complète :
- ✅ Code plus modulaire et réutilisable
- ✅ Packages indépendants et testables
- ✅ Meilleure séparation des responsabilités
- ✅ Build optimisé avec TurboRepo
- ✅ Partage de code facilité
