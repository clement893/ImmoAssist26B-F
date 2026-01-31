# @immoassist/reseau

Module Réseau - Gestion des contacts pour le réseau immobilier.

## Installation

```bash
pnpm add @immoassist/reseau
```

## Usage

```typescript
import { createReseauContactsAPI } from '@immoassist/reseau/api';
import { apiClient } from '@/lib/api/client';
import { extractApiData } from '@/lib/api/utils';

const reseauContactsAPI = createReseauContactsAPI({
  apiClient,
  extractApiData,
});

// Utiliser l'API
const contacts = await reseauContactsAPI.list(0, 100);
```

## Structure

- `types/` - Types TypeScript pour les contacts réseau
- `api/` - Client API pour les contacts réseau
