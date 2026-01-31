# @immoassist/transactions

Module Transactions - Gestion des transactions immobilières.

## Installation

```bash
pnpm add @immoassist/transactions
```

## Usage

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

// Utiliser l'API
const transactions = await transactionsAPI.list();
const contacts = await realEstateContactsAPI.list();
```

## Structure

- `types/` - Types TypeScript pour les transactions et contacts immobiliers
- `api/` - Clients API pour les transactions et contacts immobiliers
