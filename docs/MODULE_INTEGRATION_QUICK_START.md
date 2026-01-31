# Guide Rapide: Intégration de Module Externe

Guide rapide pour intégrer un module d'un autre projet créé avec ce template.

## 🚀 Méthode Rapide (Recommandée)

### Étape 1: Préparer le module source

Assurez-vous que le module source est prêt:

- ✅ Code fonctionnel
- ✅ Tests passants
- ✅ Documentation à jour

### Étape 2: Utiliser le script de migration

```bash
# Migration d'un module frontend/shared
pnpm migrate:module /chemin/vers/module-externe nom-du-module --type frontend

# Migration d'un module backend
pnpm migrate:module /chemin/vers/module-externe nom-du-module --type backend

# Dry run (voir ce qui sera fait sans modifier)
pnpm migrate:module /chemin/vers/module-externe nom-du-module --dry-run
```

### Étape 3: Vérifier et adapter

```bash
# Vérifier le code migré
cd packages/nom-du-module  # ou backend/app/modules/nom-du-module

# Adapter les imports si nécessaire
# Vérifier les dépendances
```

### Étape 4: Installer et builder

**Pour un module frontend/shared:**

```bash
cd packages/nom-du-module
pnpm install
pnpm build
```

**Pour un module backend:**

```bash
cd backend
# Ajouter les imports dans app/models/__init__.py si nécessaire
alembic revision --autogenerate -m "Add nom-du-module"
alembic upgrade head
```

### Étape 5: Utiliser dans le projet

**Frontend:**

```json
// apps/web/package.json
{
  "dependencies": {
    "@modele/nom-du-module": "workspace:*"
  }
}
```

```typescript
// Utilisation
import { Component } from "@modele/nom-du-module";
```

**Backend:**

```python
# backend/app/api/__init__.py
from app.modules.nom_du_module.api import router as nom_du_module_router
app.include_router(nom_du_module_router)
```

## 📋 Checklist Rapide

- [ ] Module source préparé
- [ ] Script de migration exécuté
- [ ] Code vérifié et adapté
- [ ] Dépendances installées
- [ ] Build réussi
- [ ] Tests passants
- [ ] Intégré dans le projet principal
- [ ] Fonctionnalités testées

## 🔍 Vérifications Importantes

### Compatibilité des versions

```bash
# Vérifier les versions de dépendances
cd packages/nom-du-module
cat package.json | grep -A 20 "dependencies\|peerDependencies"
```

### Imports à adapter

- Imports relatifs (`../../lib/...`) → Imports de packages (`@/lib/...`)
- Imports de types (`@modele/types`) → Vérifier la compatibilité
- Chemins de ressources (images, CSS) → Adapter si nécessaire

### Configuration

- Variables d'environnement spécifiques
- Configuration TypeScript
- Configuration Next.js (si nécessaire)

## 🆘 Problèmes Courants

### Erreur: "Module not found"

```bash
# Vérifier que le package est dans le workspace
cat pnpm-workspace.yaml

# Réinstaller les dépendances
pnpm install
```

### Erreur: "Type errors"

```bash
# Vérifier la configuration TypeScript
cd packages/nom-du-module
pnpm type-check

# Adapter tsconfig.json si nécessaire
```

### Erreur: "Import errors"

```bash
# Vérifier et adapter les imports
# Utiliser find/replace pour adapter les chemins
```

## 📚 Documentation Complète

Pour plus de détails, consultez:

- [Guide Complet d'Intégration](./MODULE_INTEGRATION_GUIDE.md)
- [Structure du Projet](../CODE_STRUCTURE.md)
- [Documentation des Templates](../TEMPLATE_README.md)

## 💡 Exemple Complet

```bash
# 1. Migrer un module de gestion de tâches
pnpm migrate:module /autre-projet/packages/task-manager task-manager --type frontend

# 2. Vérifier
cd packages/task-manager
pnpm install
pnpm build

# 3. Ajouter au projet
# Dans apps/web/package.json:
# "@modele/task-manager": "workspace:*"

# 4. Utiliser
# Dans apps/web/src/app/tasks/page.tsx:
# import { TaskList } from '@modele/task-manager';
```
