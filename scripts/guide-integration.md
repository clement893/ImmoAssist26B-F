# Guide Interactif d'Intégration de Module

## Informations nécessaires

Pour intégrer votre module, j'ai besoin de:

1. **Chemin du module source**
   - Exemple: `C:\autre-projet\packages\mon-module`
   - Ou: URL Git du repository

2. **Nom du module** (sans espaces, en kebab-case)
   - Exemple: `task-manager`, `crm-module`, `analytics`

3. **Type de module**
   - `frontend` - Module React/Next.js
   - `backend` - Module Python/FastAPI
   - `shared` - Module TypeScript partagé (défaut)

## Exemple de commande

```bash
# Module frontend
pnpm migrate:module C:\autre-projet\packages\task-manager task-manager --type frontend

# Module backend
pnpm migrate:module C:\autre-projet\backend\app\modules\crm crm --type backend

# Dry run (test sans modifier)
pnpm migrate:module C:\autre-projet\packages\mon-module mon-module --dry-run
```
