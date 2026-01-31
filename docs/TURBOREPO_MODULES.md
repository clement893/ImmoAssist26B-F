# Structure TurboRepo Modulaire

Ce projet est organisé en modules TurboRepo pour une meilleure séparation des responsabilités.

## Structure des Packages

### @immoassist/reseau
Module Réseau - Gestion des contacts pour le réseau immobilier.

**Localisation**: `packages/reseau/`

**Contenu**:
- Types TypeScript pour les contacts réseau (`src/types/`)
- Client API pour les contacts réseau (`src/api/`)

**Usage**:
```typescript
import { createReseauContactsAPI } from '@immoassist/reseau/api';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';

const reseauContactsAPI = createReseauContactsAPI({
  apiClient,
  extractApiData,
});
```

### @immoassist/transactions
Module Transactions - Gestion des transactions immobilières.

**Localisation**: `packages/transactions/`

**Contenu**:
- Types TypeScript pour les transactions et contacts immobiliers (`src/types/`)
- Clients API pour les transactions et contacts immobiliers (`src/api/`)

**Usage**:
```typescript
import { createTransactionsAPI, createRealEstateContactsAPI } from '@immoassist/transactions/api';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';

const transactionsAPI = createTransactionsAPI({
  apiClient,
  extractApiData,
});

const realEstateContactsAPI = createRealEstateContactsAPI({
  apiClient,
  extractApiData,
});
```

## Adaptateurs dans apps/web

Pour utiliser les packages avec l'apiClient existant de l'application, des adaptateurs ont été créés :

- `apps/web/src/lib/api/reseau-adapters.ts` - Adaptateur pour le module Réseau
- `apps/web/src/lib/api/transactions-adapters.ts` - Adaptateur pour le module Transactions

Ces adaptateurs sont réexportés depuis `apps/web/src/lib/api/index.ts` pour maintenir la compatibilité avec le code existant.

## Organisation des Pages

### Module Réseau
Les pages liées aux contacts réseau sont dans :
- `apps/web/src/app/[locale]/dashboard/reseau/contacts/` - Pages de gestion des contacts réseau

### Module Transactions
Les pages liées aux transactions sont dans :
- `apps/web/src/app/[locale]/dashboard/transactions/` - Pages de gestion des transactions
- `apps/web/src/app/[locale]/dashboard/contacts/` - Pages de gestion des contacts immobiliers (liés aux transactions)

## Composants

Les composants sont organisés dans :
- `apps/web/src/components/reseau/` - Composants pour le module Réseau
- `apps/web/src/components/transactions/` - Composants pour le module Transactions

## Prochaines Étapes

Pour une architecture encore plus modulaire, on pourrait :
1. Déplacer les composants React vers les packages (nécessite une configuration supplémentaire pour le JSX)
2. Créer des packages séparés pour les pages (nécessite une configuration Next.js spécifique)
3. Ajouter des tests unitaires dans chaque package
