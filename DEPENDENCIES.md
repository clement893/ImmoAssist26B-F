# 📦 Graph de Dépendances du Monorepo

Ce document décrit les dépendances entre les différents packages du monorepo et les règles d'isolation à respecter.

---

## 🎯 Règles d'Isolation

### ✅ Règles Autorisées

1. **Apps → Packages** ✅
   - Les applications peuvent dépendre de n'importe quel package
   - Exemple : `apps/web` → `@modele/types`

2. **Packages → Packages** ✅ (avec précaution)
   - Les packages peuvent dépendre d'autres packages
   - ⚠️ Éviter les dépendances circulaires
   - Exemple : `@modele/ui` → `@modele/types` ✅

### ❌ Règles Interdites

1. **Packages → Apps** ❌
   - Les packages ne doivent jamais dépendre des apps
   - Cela créerait un couplage fort et empêcherait la réutilisabilité

2. **Apps → Apps** ❌
   - Les apps ne doivent pas dépendre directement d'autres apps
   - Utiliser des packages partagés si nécessaire

3. **Backend → Frontend** ❌
   - Le backend ne doit jamais importer du code frontend
   - Communication uniquement via API REST

---

## 📊 Graph de Dépendances Actuel

```
┌─────────────────┐
│   apps/web      │
│  (Next.js App)  │
└────────┬────────┘
         │
         │ dépend de
         │
         ▼
┌─────────────────┐
│ @modele/types   │
│  (Types TS)     │
└─────────────────┘
         │
         │ (aucune dépendance)
         │
         ▼
      (isolé)

┌─────────────────┐
│    backend/      │
│   (FastAPI)      │
└─────────────────┘
         │
         │ (aucune dépendance frontend)
         │
         ▼
      (isolé)
```

---

## 📋 Dépendances Détaillées

### `apps/web`

**Dépendances internes :**

- `@modele/types` (workspace:\*)

**Dépendances externes :**

- `next`, `react`, `react-dom`
- `@tanstack/react-query`
- `axios`
- Et autres dépendances listées dans `apps/web/package.json`

**Règles respectées :** ✅

- Ne dépend pas d'autres apps
- Utilise uniquement des packages partagés

---

### `packages/types`

**Dépendances internes :**

- Aucune

**Dépendances externes :**

- `typescript` (devDependency uniquement)

**Règles respectées :** ✅

- Package de base sans dépendances internes
- Peut être utilisé par n'importe quel autre package

---

### `backend/`

**Dépendances internes :**

- Aucune (backend Python isolé)

**Dépendances externes :**

- `fastapi`, `sqlalchemy`, `pydantic`
- Et autres dépendances Python listées dans `backend/requirements.txt`

**Règles respectées :** ✅

- Aucune dépendance vers le frontend
- Communication uniquement via API

---

## 🚀 Graph de Dépendances Recommandé (Futur)

Pour améliorer la modularité, voici la structure recommandée :

```
┌─────────────────┐
│   apps/web      │
└────────┬────────┘
         │
         ├──► @modele/types
         ├──► @modele/ui (à créer)
         ├──► @modele/utils (à créer)
         └──► @modele/api-client (à créer)

┌─────────────────┐
│  @modele/ui     │
└────────┬────────┘
         │
         ├──► @modele/types
         └──► @modele/utils

┌─────────────────┐
│ @modele/utils   │
└─────────────────┘
         │
         │ (aucune dépendance)

┌─────────────────┐
│@modele/api-client│
└────────┬────────┘
         │
         └──► @modele/types

┌─────────────────┐
│ @modele/types   │
└─────────────────┘
         │
         │ (aucune dépendance)
```

---

## 🔍 Validation des Dépendances

### Script de Validation

Un script automatique vérifie que les règles sont respectées :

```bash
# Valider les dépendances
pnpm validate:dependencies

# Valider aussi les imports source (plus lent)
VALIDATE_IMPORTS=true pnpm validate:dependencies
```

### Vérifications Effectuées

1. ✅ Vérification des `package.json`
   - Détecte les dépendances interdites entre apps
   - Vérifie que le backend n'importe pas de packages frontend

2. ✅ Vérification des imports source (optionnel)
   - Analyse les fichiers source pour détecter les imports interdits
   - Utile pour détecter les imports directs non déclarés

---

## 📝 Conventions de Nommage

### Packages Partagés

- Préfixe : `@modele/`
- Exemples :
  - `@modele/types` - Types TypeScript
  - `@modele/ui` - Composants UI réutilisables
  - `@modele/utils` - Utilitaires partagés
  - `@modele/api-client` - Client API partagé

### Workspace Protocol

Tous les packages internes utilisent le protocole `workspace:*` :

```json
{
  "dependencies": {
    "@modele/types": "workspace:*"
  }
}
```

Cela garantit que pnpm utilise toujours la version locale du package.

---

## 🛠️ Ajout d'un Nouveau Package

### Étapes

1. **Créer le répertoire**

   ```bash
   mkdir -p packages/nouveau-package/src
   ```

2. **Créer `package.json`**

   ```json
   {
     "name": "@modele/nouveau-package",
     "version": "1.0.0",
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "dev": "tsc --watch"
     }
   }
   ```

3. **Ajouter au workspace**
   - Vérifier que `pnpm-workspace.yaml` inclut `packages/*`

4. **Installer les dépendances**

   ```bash
   pnpm install
   ```

5. **Valider les dépendances**
   ```bash
   pnpm validate:dependencies
   ```

---

## ⚠️ Dépendances Circulaires

### Détection

Les dépendances circulaires sont interdites. Exemple interdit :

```
@modele/ui → @modele/utils → @modele/ui ❌
```

### Solution

Extraire la dépendance commune dans un package séparé :

```
@modele/ui → @modele/types
@modele/utils → @modele/types ✅
```

---

## 📚 Ressources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Monorepo Best Practices](https://monorepo.tools/)

---

## 🔄 Mise à Jour

Ce document doit être mis à jour lors de :

- Ajout d'un nouveau package
- Changement de dépendances entre packages
- Modification des règles d'isolation

**Dernière mise à jour :** $(date)
