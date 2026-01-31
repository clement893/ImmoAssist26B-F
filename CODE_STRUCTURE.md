# 📁 Structure du Code - Guide de Référence

Ce document décrit la structure détaillée du code pour faciliter la navigation et la compréhension.

## 🎯 Vue d'Ensemble

```
MODELE-NEXTJS-FULLSTACK/
├── apps/web/              # Application Next.js (Frontend)
├── backend/               # Application FastAPI (Backend)
├── packages/types/        # Types TypeScript partagés
├── scripts/               # Scripts d'automatisation
├── docs/                  # Documentation
└── templates/             # Templates de modules
```

---

## 📱 Frontend (`apps/web/`)

### Structure Principale

```
apps/web/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── [locale]/            # Routes internationalisées
│   │   │   ├── (auth)/          # Routes d'authentification
│   │   │   ├── admin/           # Pages admin
│   │   │   ├── dashboard/       # Dashboard utilisateur
│   │   │   ├── settings/        # Paramètres
│   │   │   └── ...              # Autres pages
│   │   ├── api/                 # API Routes Next.js
│   │   └── layout.tsx           # Layout racine
│   │
│   ├── components/               # Composants React (270+)
│   │   ├── ui/                  # Composants UI de base (96)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   ├── auth/                # Composants auth
│   │   ├── billing/             # Composants billing
│   │   ├── layout/              # Composants layout
│   │   └── ...                  # 50+ catégories
│   │
│   ├── lib/                     # Bibliothèques et utilitaires
│   │   ├── api/                 # Clients API
│   │   │   ├── client.ts        # Client Axios configuré
│   │   │   ├── users.ts         # API users
│   │   │   ├── auth.ts          # API auth
│   │   │   └── ...
│   │   ├── errors.ts            # Gestion erreurs
│   │   ├── logger.ts            # Système logging
│   │   ├── theme/               # Système de thème
│   │   └── utils/               # Utilitaires divers
│   │
│   ├── hooks/                   # Hooks React personnalisés
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   └── ...
│   │
│   ├── contexts/                # Contextes React
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   └── i18n/                    # Internationalisation
│       ├── messages/
│       └── config.ts
│
├── public/                      # Assets statiques
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── .env.example                 # Variables d'environnement exemple
├── next.config.js               # Configuration Next.js
├── tailwind.config.js           # Configuration Tailwind
└── tsconfig.json                # Configuration TypeScript
```

### Points Clés Frontend

1. **App Router**: Utilise le nouveau App Router de Next.js 16
2. **Internationalisation**: Routes avec `[locale]` (fr, en)
3. **Composants**: Organisés par catégorie fonctionnelle
4. **API Client**: Centralisé dans `lib/api/`
5. **Types**: Importés depuis `@modele/types`

---

## 🔧 Backend (`backend/`)

### Structure Principale

```
backend/
├── app/
│   ├── api/                     # Routes API
│   │   └── v1/
│   │       ├── router.py        # Enregistrement routers
│   │       └── endpoints/       # Endpoints par ressource
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── admin.py
│   │           └── ...
│   │
│   ├── models/                  # Modèles SQLAlchemy
│   │   ├── user.py
│   │   ├── post.py
│   │   └── ...
│   │
│   ├── schemas/                 # Schémas Pydantic
│   │   ├── user.py
│   │   └── ...
│   │
│   ├── services/                # Logique métier
│   │   ├── user_service.py
│   │   ├── auth_service.py
│   │   └── ...
│   │
│   ├── core/                     # Configuration
│   │   ├── config.py            # Variables d'environnement
│   │   ├── database.py          # Configuration DB
│   │   └── security.py          # Sécurité (JWT, etc.)
│   │
│   ├── dependencies.py          # Dépendances FastAPI
│   ├── main.py                  # Point d'entrée
│   └── utils/                   # Utilitaires
│
├── alembic/                     # Migrations
│   ├── versions/                # Fichiers de migration
│   └── env.py
│
├── tests/                        # Tests pytest
│   ├── test_users.py
│   └── ...
│
├── .env.example                 # Variables d'environnement
├── requirements.txt              # Dépendances Python
├── Dockerfile                    # Image Docker
└── pyproject.toml               # Configuration Python
```

### Points Clés Backend

1. **FastAPI**: Framework async moderne
2. **SQLAlchemy**: ORM async avec `AsyncSession`
3. **Pydantic**: Validation des données
4. **Alembic**: Migrations de base de données
5. **Structure**: Séparation claire endpoints/services/models

---

## 📦 Packages (`packages/types/`)

### Structure

```
packages/types/
├── src/
│   ├── index.ts                 # Exports principaux
│   ├── generated.ts             # Types générés depuis Pydantic
│   └── custom.ts                # Types personnalisés
├── package.json
└── tsconfig.json
```

### Génération des Types

Les types sont générés automatiquement depuis les schémas Pydantic:

```bash
cd backend
python scripts/generate_types.py
```

---

## 🗂️ Organisation par Fonctionnalité

### Exemple: Système d'Utilisateurs

**Frontend:**

```
apps/web/src/
├── app/[locale]/admin/users/    # Pages admin users
├── components/users/            # Composants users
├── lib/api/users.ts             # API client users
└── hooks/useUsers.ts            # Hook users
```

**Backend:**

```
backend/app/
├── api/v1/endpoints/users.py   # Endpoints users
├── models/user.py               # Modèle User
├── schemas/user.py              # Schémas User
└── services/user_service.py     # Service User
```

---

## 🔍 Fichiers de Configuration Importants

### Frontend

| Fichier              | Description                                 |
| -------------------- | ------------------------------------------- |
| `next.config.js`     | Configuration Next.js (rewrites, env, etc.) |
| `tailwind.config.js` | Configuration Tailwind CSS                  |
| `tsconfig.json`      | Configuration TypeScript                    |
| `.env.local`         | Variables d'environnement locales           |

### Backend

| Fichier                | Description                             |
| ---------------------- | --------------------------------------- |
| `app/main.py`          | Configuration FastAPI, CORS, middleware |
| `app/core/config.py`   | Variables d'environnement               |
| `app/core/database.py` | Configuration SQLAlchemy                |
| `.env`                 | Variables d'environnement               |

### Monorepo

| Fichier               | Description                 |
| --------------------- | --------------------------- |
| `package.json`        | Scripts et dépendances root |
| `turbo.json`          | Configuration Turborepo     |
| `pnpm-workspace.yaml` | Configuration workspaces    |

---

## 🎨 Patterns de Nommage

### Fichiers

- **Composants React**: `PascalCase.tsx` (`UserProfile.tsx`)
- **Pages**: `page.tsx`, `layout.tsx`, `loading.tsx`
- **Hooks**: `camelCase.ts` (`useAuth.ts`)
- **Utilitaires**: `camelCase.ts` (`formatDate.ts`)
- **Types**: `camelCase.ts` (`user.types.ts`)

### Backend Python

- **Modules**: `snake_case.py` (`user_service.py`)
- **Classes**: `PascalCase` (`UserService`)
- **Fonctions**: `snake_case` (`get_user_by_id`)
- **Constantes**: `UPPER_SNAKE_CASE` (`MAX_RETRIES`)

---

## 📊 Flux de Données

### Frontend → Backend

```
Component → API Client → Axios → FastAPI Endpoint → Service → Database
```

### Exemple Complet

1. **Composant React** appelle `usersAPI.get(1)`
2. **API Client** fait requête GET à `/api/v1/users/1`
3. **FastAPI Endpoint** `/users/{user_id}` reçoit requête
4. **Service** `UserService.get_by_id()` interroge DB
5. **Modèle SQLAlchemy** récupère données
6. **Schéma Pydantic** valide et sérialise réponse
7. **Réponse JSON** retournée au frontend
8. **Composant** met à jour l'état avec les données

---

## 🔐 Sécurité

### Authentification Flow

```
1. User login → POST /api/v1/auth/login
2. Backend vérifie credentials
3. Backend génère JWT token
4. Token stocké dans httpOnly cookie
5. Toutes requêtes suivantes incluent cookie automatiquement
6. Backend vérifie token via get_current_user dependency
```

### Fichiers Clés Sécurité

- `backend/app/core/security.py` - JWT, password hashing
- `backend/app/dependencies.py` - `get_current_user`
- `apps/web/src/lib/api/client.ts` - Configuration Axios avec credentials

---

## 🧪 Tests

### Structure Tests

```
apps/web/src/components/__tests__/    # Tests composants
apps/web/src/lib/__tests__/           # Tests utilitaires
backend/tests/                         # Tests backend
```

### Commandes Tests

```bash
# Frontend
pnpm test              # Vitest
pnpm test:e2e          # Playwright

# Backend
cd backend
pytest                 # Tests unitaires
pytest --cov           # Avec coverage
```

---

## 📝 Documentation

### Où Trouver l'Information

- **API**: `backend/API_ENDPOINTS.md` ou `/docs` (Swagger)
- **Composants**: `apps/web/src/components/README.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Database**: `backend/DATABASE_SCHEMA.md`
- **Setup**: `TEMPLATE_SETUP.md`

---

## 🚀 Points d'Entrée

### Développement

```bash
# Frontend
pnpm dev              # http://localhost:3000

# Backend
cd backend
uvicorn app.main:app --reload  # http://localhost:8000
```

### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

---

**Dernière mise à jour**: 2025-01-27
