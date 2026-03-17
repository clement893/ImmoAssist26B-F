# Guide des Tests Unitaires

Ce document décrit comment utiliser le système de tests unitaires configuré pour le projet.

## 📋 Vue d'ensemble

Le projet utilise deux frameworks de test principaux :

- **Frontend (Next.js)**: Vitest avec Testing Library
- **Backend (FastAPI)**: Pytest avec pytest-asyncio

## 🚀 Démarrage rapide

### Exécuter tous les tests

```bash
# Tous les tests (frontend + backend)
pnpm test:all

# Avec couverture de code
pnpm test:all:coverage

# Mode watch (frontend uniquement)
pnpm test:all:watch
```

### Tests frontend uniquement

```bash
# Exécuter les tests
pnpm test:web

# Mode watch
pnpm test:web:watch

# Avec couverture
pnpm test:web:coverage

# Interface UI
pnpm test:web:ui
```

### Tests backend uniquement

```bash
# Exécuter les tests
pnpm test:backend

# Avec couverture
pnpm test:backend:coverage

# Mode watch (nécessite pytest-watch)
pnpm test:backend:watch
```

## 📁 Structure des tests

### Frontend

```
apps/web/src/
├── components/
│   └── ui/
│       ├── Button.test.tsx
│       └── Card.test.tsx
├── lib/
│   └── utils.test.ts
└── test/
    └── setup.ts          # Configuration globale des tests
```

### Backend

```
backend/
├── tests/
│   ├── conftest.py       # Fixtures et configuration pytest
│   ├── test_auth.py
│   ├── test_users.py
│   └── integration/     # Tests d'intégration
└── pytest.ini            # Configuration pytest
```

## ✍️ Écrire des tests

### Test de composant React (Frontend)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByText('Click me');
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Test d'API (Backend)

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    response = await client.post(
        "/api/v1/users",
        json={
            "email": "test@example.com",
            "password": "testpassword123",
            "first_name": "Test",
            "last_name": "User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
```

### Test de service (Backend)

```python
import pytest
from app.services.user_service import UserService

@pytest.mark.asyncio
async def test_get_user_by_id(db: AsyncSession, test_user: User):
    service = UserService(db)
    user = await service.get_by_id(test_user.id)

    assert user is not None
    assert user.email == test_user.email
```

## 🎯 Bonnes pratiques

### Frontend

1. **Nommer les fichiers de test**: `*.test.tsx` ou `*.test.ts`
2. **Utiliser des descriptions claires**: `describe('ComponentName', () => {})`
3. **Tester le comportement, pas l'implémentation**
4. **Utiliser les queries de Testing Library** (getByRole, getByText, etc.)
5. **Mocker les dépendances externes** (API, router, etc.)

### Backend

1. **Nommer les fichiers**: `test_*.py`
2. **Utiliser des fixtures** pour les données de test réutilisables
3. **Isoler les tests** - chaque test doit être indépendant
4. **Utiliser des markers** pour organiser les tests (`@pytest.mark.unit`, `@pytest.mark.integration`)
5. **Tester les cas limites** et les erreurs

## 📊 Couverture de code

### Objectifs de couverture

- **Lignes**: 70%
- **Fonctions**: 70%
- **Branches**: 70%
- **Statements**: 70%

### Consulter les rapports

**Frontend:**

```bash
pnpm test:web:coverage
# Ouvrir apps/web/coverage/index.html
```

**Backend:**

```bash
pnpm test:backend:coverage
# Ouvrir backend/htmlcov/index.html
```

## 🔧 Configuration

### Vitest (Frontend)

Configuration dans `apps/web/vitest.config.ts`:

- Environnement: jsdom
- Coverage: v8
- Setup: `src/test/setup.ts`

### Pytest (Backend)

Configuration dans `backend/pytest.ini`:

- Base de données de test: SQLite en mémoire
- Coverage: pytest-cov
- Fixtures: `tests/conftest.py`

## 🐛 Dépannage

### Les tests frontend ne se lancent pas

1. Vérifier que les dépendances sont installées: `pnpm install`
2. Vérifier la configuration Vitest: `apps/web/vitest.config.ts`
3. Vérifier le fichier de setup: `apps/web/src/test/setup.ts`

### Les tests backend échouent

1. Vérifier que les dépendances Python sont installées: `pip install -r requirements.txt`
2. Vérifier la configuration pytest: `backend/pytest.ini`
3. Vérifier que la base de données de test est configurée correctement

### Coverage trop bas

1. Identifier les fichiers non testés dans le rapport de coverage
2. Ajouter des tests pour les fonctions non couvertes
3. Vérifier les seuils dans `vitest.config.ts` et `pytest.ini`

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## 🎓 Exemples

Des exemples de tests sont disponibles dans:

- Frontend: `apps/web/src/components/ui/*.test.tsx`
- Backend: `backend/tests/test_*.py`
