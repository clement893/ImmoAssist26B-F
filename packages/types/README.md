# @modele/types

Shared TypeScript types for MODELE-NEXTJS-FULLSTACK project.

## Installation

This package is part of the monorepo workspace and is automatically linked.

## Usage

```typescript
import { User, ApiResponse, PaginatedResponse } from "@modele/types";

// Use types in your code
const user: User = {
  id: "1",
  email: "user@example.com",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## Building

```bash
pnpm build
```

## Development

```bash
pnpm dev  # Watch mode
```
