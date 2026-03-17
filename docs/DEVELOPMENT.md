# 🛠️ Guide de Développement

Guide complet pour développer avec le template MODELE-NEXTJS-FULLSTACK.

> **📢 Recent Updates:** Development experience has been improved with structured logging, better type safety, comprehensive tests, and optimized database queries. See [TEMPLATE_UPDATES.md](../../TEMPLATE_UPDATES.md) for details.

## 📋 Table des Matières

- [Prérequis](#prérequis)
- [Configuration de l'environnement](#configuration-de-lenvironnement)
- [Structure du projet](#structure-du-projet)
- [Scripts disponibles](#scripts-disponibles)
- [Génération de code](#génération-de-code)
- [Workflow de développement](#workflow-de-développement)
- [Standards de code](#standards-de-code)

---

## 📦 Prérequis

- **Node.js** 20.x ou supérieur
- **pnpm** 9.x ou supérieur
- **Python** 3.11+ (optionnel, pour la génération de types)
- **PostgreSQL** 14+ (ou Docker)
- **Redis** 7+ (optionnel, pour les jobs en arrière-plan)
- **Git**

---

## ⚙️ Configuration de l'environnement

### Variables d'environnement Backend

Copier `backend/.env.example` vers `backend/.env` et configurer :

```env
ENVIRONMENT=development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db
SECRET_KEY=votre-secret-key-minimum-32-caracteres
FRONTEND_URL=http://localhost:3000
```

### Variables d'environnement Frontend

Copier `apps/web/.env.example` vers `apps/web/.env.local` et configurer :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre-secret-key
```

---

## 📁 Structure du Projet

```
MODELE-NEXTJS-FULLSTACK/
├── apps/
│   └── web/              # Frontend Next.js
│       ├── src/
│       │   ├── app/      # Pages et routes
│       │   ├── components/ # Composants React
│       │   └── lib/      # Utilitaires
│       └── package.json
├── backend/              # Backend FastAPI
│   ├── app/
│   │   ├── api/         # Endpoints API
│   │   ├── models/      # Modèles SQLAlchemy
│   │   ├── schemas/     # Schémas Pydantic
│   │   └── services/    # Logique métier
│   └── requirements.txt
├── packages/
│   └── types/           # Types TypeScript partagés
├── scripts/             # Scripts utilitaires
└── docs/                # Documentation
```

---

## 🚀 Scripts Disponibles

### Développement

```bash
# Démarrer le frontend (Next.js)
pnpm dev

# Démarrer Storybook (depuis apps/web)
cd apps/web && pnpm storybook

# Démarrer le backend (depuis backend/)
cd backend && pnpm dev
```

**Note:** Pour démarrer frontend et backend simultanément, utilisez deux terminaux ou un gestionnaire de processus comme `concurrently`.

### Tests

```bash
# Tous les tests (frontend + backend)
pnpm test

# Tests frontend avec watch mode
cd apps/web && pnpm test:watch

# Tests E2E avec Playwright
cd apps/web && pnpm test:e2e

# Tests avec couverture
cd apps/web && pnpm test:coverage

# Tests backend
cd backend && pnpm test
```

### Qualité de Code

```bash
# Linter (récursif)
pnpm lint

# Vérification TypeScript (récursif)
pnpm type-check

# Formater le code
pnpm format
```

### Sécurité

```bash
# Audit de sécurité
pnpm security:audit

# Scan de sécurité complet
pnpm security:check
```

### Validation d'Environnement

```bash
# Valider les variables d'environnement frontend
pnpm validate:env:frontend

# Valider les variables d'environnement backend
pnpm validate:env:backend
```

### Base de Données (Backend)

```bash
cd backend

# Créer une migration
pnpm migrate:create MigrationName

# Appliquer les migrations
pnpm migrate:upgrade

# Rollback
pnpm migrate:downgrade

# Voir la version actuelle
pnpm migrate:current

# Voir l'historique
pnpm migrate:history
```

### Analyse (Frontend)

```bash
cd apps/web

# Analyse de bundle
pnpm analyze

# Analyse serveur uniquement
pnpm analyze:server

# Analyse navigateur uniquement
pnpm analyze:browser
```

---

## 🎯 Génération de Code

> **Note:** Les générateurs de code mentionnés dans la documentation ne sont pas encore implémentés dans le package.json racine. Pour l'instant, créez les fichiers manuellement en suivant la structure existante du projet.

### Structure des Composants

Les composants React suivent cette structure :

- `apps/web/src/components/[category]/ComponentName.tsx` - Composant principal
- `apps/web/src/components/[category]/ComponentName.stories.tsx` - Storybook (optionnel)
- `apps/web/src/components/[category]/__tests__/ComponentName.test.tsx` - Tests (optionnel)

### Structure des Pages

Les pages Next.js suivent cette structure :

- `apps/web/src/app/[locale]/[route]/page.tsx` - Page principale

### Structure des Routes API

Les routes API backend suivent cette structure :

- `backend/app/api/v1/endpoints/[endpoint].py` - Endpoint API
- `backend/app/schemas/[schema].py` - Schémas Pydantic

---

## 🔄 Workflow de Développement

### 1. Créer une branche

```bash
git checkout -b feat/ma-fonctionnalite
```

### 2. Développer

```bash
# Démarrer le serveur de développement
pnpm dev:full

# Dans un autre terminal, exécuter les tests en watch
pnpm test:web:watch
```

### 3. Tester

```bash
# Exécuter tous les tests
pnpm test

# Vérifier le linting
pnpm lint

# Vérifier les types
pnpm type-check
```

### 4. Commit

```bash
git add .
git commit -m "feat: ajouter ma fonctionnalité"
```

### 5. Push et Pull Request

```bash
git push origin feat/ma-fonctionnalite
```

---

## 📝 Standards de Code

### Logging

**✅ Use structured logger instead of console.log:**

```typescript
// ✅ Good: Use structured logger
import { logger } from "@/lib/logger";

logger.log("User action", { userId: user.id });
logger.error("Error occurred", error);
logger.debug("Debug info", { data });

// ❌ Bad: Don't use console.log
console.log("User action", user);
console.error("Error", error);
```

### Type Safety

**✅ Always use specific types instead of `any`:**

```typescript
// ✅ Good: Use specific types
interface UserPreferences {
  theme: "light" | "dark";
  language: string;
}

function updatePreferences(prefs: UserPreferences) {
  // ...
}

// ❌ Bad: Don't use any
function updatePreferences(prefs: any) {
  // ...
}
```

### API Calls

**✅ Always use `apiClient` instead of `fetch()` for API calls:**

```typescript
// ✅ Good: Use apiClient
import { apiClient } from "@/lib/api/client";
import { extractApiData } from "@/lib/api/utils";

const response = await apiClient.get<User[]>("/v1/users");
const users = extractApiData(response);

// ❌ Bad: Don't use fetch()
const response = await fetch("/api/v1/users");
const users = await response.json();
```

**✅ Use normalized API paths without duplicate prefixes:**

```typescript
// ✅ Good: Normalized path
await apiClient.get("/v1/announcements");

// ❌ Bad: Duplicate prefix
await apiClient.get("/api/v1/announcements/announcements");
```

### API Responses

**✅ Use extractApiData helper for type-safe API responses:**

```typescript
// ✅ Good: Use extractApiData
import { extractApiData } from "@/lib/api/utils";

const response = await apiClient.get<ApiResponse<User>>("/users/1");
const user = extractApiData(response); // Type-safe extraction

// ❌ Bad: Type assertion
const user = (response as any).data || response;
```

### Database Queries

**✅ Use eager loading to avoid N+1 queries:**

```python
# ✅ Good: Eager load relationships
from sqlalchemy.orm import selectinload

query = select(Team).options(
    selectinload(Team.members),
    selectinload(Team.owner)
)

# ❌ Bad: Lazy loading causes N+1 queries
query = select(Team)  # Members loaded separately
```

### Testing

**✅ Write tests for critical components and endpoints:**

```typescript
// ✅ Good: Test error handling
describe("ApiError", () => {
  it("should display error message", () => {
    // Test implementation
  });
});
```

```python
# ✅ Good: Test endpoints
@pytest.mark.asyncio
async def test_create_user(client: TestClient):
    # Test implementation
```

---

## 📝 Standards de Code (General)

### TypeScript

- Utiliser TypeScript strict
- Éviter `any` (utiliser `unknown` si nécessaire)
- Typer toutes les fonctions et composants

### Python

- Suivre PEP 8
- Utiliser type hints
- Documenter avec docstrings

### Formatage

- Frontend : Prettier
- Backend : Black

### Linting

- Frontend : ESLint
- Backend : Ruff

---

## 🧪 Tests

Voir [Guide des Tests](./TESTING.md) pour plus de détails.

---

## 🔧 Dépannage

Voir [Guide de Dépannage](./TROUBLESHOOTING.md) pour résoudre les problèmes courants.

---

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
