# 🤖 Guide pour Assistants IA

Ce guide est conçu pour aider les assistants IA à comprendre et travailler efficacement avec ce template.

## 📋 Table des Matières

1. [Structure du Projet](#structure-du-projet)
2. [Conventions de Code](#conventions-de-code)
3. [Patterns Communs](#patterns-communs)
4. [Fichiers Clés à Connaître](#fichiers-clés-à-connaître)
5. [Types et Interfaces](#types-et-interfaces)
6. [API et Endpoints](#api-et-endpoints)
7. [Base de Données](#base-de-données)
8. [Composants React](#composants-react)
9. [Gestion d'État](#gestion-détat)
10. [Tests](#tests)

---

## 🏗️ Structure du Projet

### Architecture Monorepo

```
MODELE-NEXTJS-FULLSTACK/
├── apps/
│   └── web/                    # Frontend Next.js 16
│       ├── src/
│       │   ├── app/            # App Router (pages)
│       │   ├── components/     # Composants React (270+)
│       │   ├── lib/            # Utilitaires et helpers
│       │   ├── hooks/          # Hooks React personnalisés
│       │   └── contexts/       # Contextes React
│       └── public/             # Assets statiques
├── backend/                     # Backend FastAPI
│   ├── app/
│   │   ├── api/v1/endpoints/  # Routes API
│   │   ├── models/             # Modèles SQLAlchemy
│   │   ├── schemas/            # Schémas Pydantic
│   │   ├── services/           # Logique métier
│   │   └── core/               # Configuration
│   └── alembic/                # Migrations DB
├── packages/
│   └── types/                  # Types TypeScript partagés
└── scripts/                     # Scripts d'automatisation
```

### Points Importants

- **Frontend**: Next.js 16 avec App Router, React 19, TypeScript strict
- **Backend**: FastAPI avec SQLAlchemy (async), Pydantic pour validation
- **Base de données**: PostgreSQL avec Alembic pour migrations
- **Monorepo**: Turborepo + pnpm workspaces

---

## 📝 Conventions de Code

### TypeScript

```typescript
// ✅ BON: Types explicites
interface User {
  id: number;
  email: string;
  name: string;
}

function getUser(id: number): Promise<User> {
  // ...
}

// ❌ ÉVITER: Types implicites ou 'any'
function getUser(id) {
  // Type manquant
  // ...
}
```

### Naming Conventions

- **Composants**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase avec préfixe `use` (`useAuth.ts`)
- **Utilitaires**: camelCase (`formatDate.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`, `ApiResponse`)

### Fichiers et Dossiers

- **Pages**: `apps/web/src/app/[locale]/page-name/page.tsx`
- **Composants**: `apps/web/src/components/category/ComponentName.tsx`
- **API Routes**: `backend/app/api/v1/endpoints/resource.py`
- **Services**: `backend/app/services/resource_service.py`
- **Modèles**: `backend/app/models/resource.py`

---

## 🔄 Patterns Communs

### 1. API Client Pattern

```typescript
// apps/web/src/lib/api/client.ts
import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Pour les cookies httpOnly
});

// Utilisation standardisée
export const usersAPI = {
  get: (id: number) => apiClient.get(`/v1/users/${id}`),
  list: (params?: Record<string, unknown>) =>
    apiClient.get("/v1/users", { params }),
  create: (data: UserCreate) => apiClient.post("/v1/users", data),
  update: (id: number, data: UserUpdate) =>
    apiClient.put(`/v1/users/${id}`, data),
  delete: (id: number) => apiClient.delete(`/v1/users/${id}`),
};
```

### 2. Backend Endpoint Pattern

```python
# backend/app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.schemas.user import UserResponse, UserCreate

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user by ID"""
    # Logique ici
    pass
```

### 3. React Component Pattern

```typescript
// Composant avec gestion d'état et API
'use client';

import { useState, useEffect } from 'react';
import { usersAPI } from '@/lib/api/users';
import { getErrorMessage } from '@/lib/errors';
import { logger } from '@/lib/logger';

interface UserProfileProps {
  userId: number;
}

export function UserProfile({ userId }: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const response = await usersAPI.get(userId);
        setUser(response.data);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        logger.error('Failed to load user', { error: err, userId });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return <div>{/* UI */}</div>;
}
```

### 4. Service Pattern (Backend)

```python
# backend/app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserCreate

class UserService:
    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
        """Get user by ID"""
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def create(db: AsyncSession, user_data: UserCreate) -> User:
        """Create new user"""
        user = User(**user_data.dict())
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
```

---

## 🔑 Fichiers Clés à Connaître

### Frontend

| Fichier                                | Description                           |
| -------------------------------------- | ------------------------------------- |
| `apps/web/src/lib/api/client.ts`       | Client API Axios configuré            |
| `apps/web/src/lib/errors.ts`           | Gestion centralisée des erreurs       |
| `apps/web/src/lib/logger.ts`           | Système de logging                    |
| `apps/web/src/components/ui/`          | Bibliothèque de composants UI de base |
| `apps/web/src/app/[locale]/layout.tsx` | Layout principal avec providers       |

### Backend

| Fichier                        | Description                                     |
| ------------------------------ | ----------------------------------------------- |
| `backend/app/main.py`          | Point d'entrée FastAPI, configuration CORS      |
| `backend/app/core/config.py`   | Configuration centralisée (env vars)            |
| `backend/app/core/database.py` | Configuration SQLAlchemy async                  |
| `backend/app/api/v1/router.py` | Enregistrement de tous les routers              |
| `backend/app/dependencies.py`  | Dépendances communes (get_db, get_current_user) |

### Configuration

| Fichier                    | Description                             |
| -------------------------- | --------------------------------------- |
| `package.json` (root)      | Scripts monorepo, dépendances partagées |
| `turbo.json`               | Configuration Turborepo                 |
| `pnpm-workspace.yaml`      | Configuration pnpm workspaces           |
| `backend/requirements.txt` | Dépendances Python                      |
| `.env.example`             | Exemples de variables d'environnement   |

---

## 🎯 Types et Interfaces

### Types Partagés

Les types sont générés automatiquement depuis les schémas Pydantic et stockés dans `packages/types/src/`.

```typescript
// packages/types/src/index.ts
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}
```

### Utilisation dans le Frontend

```typescript
import type { User, ApiResponse } from "@modele/types";

const response = await apiClient.get<ApiResponse<User>>("/v1/users/1");
const user = response.data.data; // Type-safe!
```

---

## 🌐 API et Endpoints

### Structure des Endpoints

Tous les endpoints suivent le pattern: `/api/v1/{resource}/{action}`

**Exemples:**

- `GET /api/v1/users` - Liste des utilisateurs
- `GET /api/v1/users/{id}` - Utilisateur par ID
- `POST /api/v1/users` - Créer utilisateur
- `PUT /api/v1/users/{id}` - Mettre à jour utilisateur
- `DELETE /api/v1/users/{id}` - Supprimer utilisateur

### Authentification

```typescript
// Tous les endpoints (sauf /auth/*) nécessitent un token JWT
// Le token est envoyé automatiquement via cookies httpOnly
// Vérifié côté backend via get_current_user dependency
```

### Gestion des Erreurs

```typescript
// Frontend: apps/web/src/lib/errors.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

// Backend: HTTPException avec codes appropriés
raise HTTPException(status_code=404, detail="User not found")
```

---

## 🗄️ Base de Données

### Modèles SQLAlchemy

```python
# backend/app/models/user.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    posts = relationship("Post", back_populates="author")
```

### Migrations Alembic

```bash
# Créer une migration
cd backend
alembic revision --autogenerate -m "description"

# Appliquer migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Schémas Pydantic

```python
# backend/app/schemas/user.py
from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True  # Pour SQLAlchemy
```

---

## ⚛️ Composants React

### Structure d'un Composant

```typescript
'use client'; // Si besoin de hooks/interactivité

import { useState, useEffect } from 'react';
import type { ComponentProps } from '@/types';

interface MyComponentProps {
  // Props typées
  title: string;
  optional?: boolean;
}

export function MyComponent({ title, optional = false }: MyComponentProps) {
  // État local
  const [state, setState] = useState<string>('');

  // Effets
  useEffect(() => {
    // Logique
  }, []);

  // Rendu
  return <div>{title}</div>;
}
```

### Composants UI de Base

Tous les composants UI sont dans `apps/web/src/components/ui/`:

- `Button`, `Input`, `Card`, `Modal`, `DataTable`, etc.
- Utilisent Tailwind CSS
- Supportent dark mode automatiquement
- Accessibles (ARIA)

---

## 🔄 Gestion d'État

### État Local (useState)

```typescript
const [value, setValue] = useState<Type>(initialValue);
```

### État Global (Context)

```typescript
// apps/web/src/contexts/AuthContext.tsx
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### Cache API (React Query - si utilisé)

```typescript
// Pattern recommandé pour le cache API
const { data, isLoading, error } = useQuery({
  queryKey: ["users", userId],
  queryFn: () => usersAPI.get(userId),
});
```

---

## 🧪 Tests

### Tests Frontend (Vitest)

```typescript
// apps/web/src/components/__tests__/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Tests Backend (pytest)

```python
# backend/tests/test_users.py
import pytest
from app.models.user import User

@pytest.mark.asyncio
async def test_get_user(db_session):
    user = await UserService.get_by_id(db_session, 1)
    assert user is not None
    assert user.email == "test@example.com"
```

---

## 💡 Conseils pour les Assistants IA

### 1. Toujours Vérifier les Types

```typescript
// ✅ Vérifier les types disponibles
import type { User } from "@modele/types";

// ✅ Utiliser les types dans les fonctions
function processUser(user: User): void {
  // TypeScript vous aidera
}
```

### 2. Suivre les Patterns Existants

- Regarder un composant similaire existant
- Copier la structure et adapter
- Maintenir la cohérence

### 3. Utiliser les Utilitaires Existants

```typescript
// ✅ Utiliser les helpers existants
import { getErrorMessage } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { formatDate } from "@/lib/utils/date";

// ❌ Ne pas réinventer la roue
```

### 4. Documenter les Décisions Complexes

```typescript
/**
 * Pourquoi cette approche?
 * - Raison 1
 * - Raison 2
 *
 * Alternatives considérées:
 * - Alternative A (rejetée car...)
 */
```

### 5. Vérifier les Endpoints API

- Consulter `backend/API_ENDPOINTS.md`
- Vérifier Swagger UI: `http://localhost:8000/docs`
- Tester avec les scripts de test API

### 6. Respecter les Conventions

- Noms de fichiers: kebab-case pour les fichiers, PascalCase pour composants
- Imports: ordre logique (React, libs, components, utils, types)
- Exports: nommés pour composants, default pour pages

---

## 📚 Ressources Additionnelles

- **Documentation API**: `backend/API_ENDPOINTS.md`
- **Structure DB**: `backend/DATABASE_SCHEMA.md`
- **Composants**: `apps/web/src/components/README.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Guide de démarrage**: `TEMPLATE_SETUP.md`

---

## 🎯 Checklist pour Modifications

Avant de modifier le code:

- [ ] Comprendre la structure existante
- [ ] Vérifier les types disponibles
- [ ] Suivre les patterns existants
- [ ] Utiliser les utilitaires existants
- [ ] Ajouter des types TypeScript explicites
- [ ] Gérer les erreurs proprement
- [ ] Tester les modifications
- [ ] Documenter les décisions complexes

---

**Dernière mise à jour**: 2025-01-27
