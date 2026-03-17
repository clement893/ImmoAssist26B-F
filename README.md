# Léa Chat API

**Projet indépendant** — API pour le chat Léa (assistant conversationnel), les transactions et les promesses d'achat.

Architecture conforme à la fiche technique : router LLM, orchestrator, executor, context loader.

## Démarrage rapide

```bash
cd backend
cp .env.example .env
# Éditer .env : LEA_DEMO_TOKEN, OPENAI_API_KEY, etc.

# Lancer l'API slim
uvicorn main_slim:app --reload
```

API disponible sur : http://localhost:8000  
Docs : http://localhost:8000/docs

## Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/lea/chat` | Chat avec Léa |
| `GET /api/v1/transactions` | Liste des transactions |
| `GET /api/v1/oaciq-forms/...` | Formulaires OACIQ (PA, etc.) |

## Authentification

- **Mode démo** : en-tête `X-LEA-Demo-Token: <LEA_DEMO_TOKEN>` (pas de JWT)
- **Mode JWT** : login via `POST /api/v1/auth/login` puis Bearer token

## Base de données

- **SQLite** (par défaut) : `DATABASE_URL=sqlite+aiosqlite:///./lea_chat.db`
- **PostgreSQL** : `DATABASE_URL=postgresql+asyncpg://...`

## Structure

- `main_slim.py` : point d'entrée minimal
- `app/api/v1/router_slim.py` : routes (lea, transactions, oaciq)
- `app/services/lea_chat/` : module refactoré (orchestrator, router, executor)
- `docs/lea/`, `docs/oaciq/` : base de connaissance Léa

## Intégration

API REST standard. Une fois validée, elle peut être appelée depuis n'importe quel client (frontend, autre backend) via HTTP.
