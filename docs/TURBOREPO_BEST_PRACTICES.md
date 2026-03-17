# 🏗️ Meilleures Pratiques TurboRepo - Architecture Modulaire

Ce document décrit les meilleures pratiques pour construire une base solide avec TurboRepo et une architecture modulaire.

## 📋 Table des Matières

1. [Principes Fondamentaux](#principes-fondamentaux)
2. [Structure Recommandée](#structure-recommandée)
3. [Organisation des Packages](#organisation-des-packages)
4. [Séparation des Responsabilités](#séparation-des-responsabilités)
5. [Gestion des Dépendances](#gestion-des-dépendances)
6. [Configuration Partagée](#configuration-partagée)
7. [Build et Cache](#build-et-cache)
8. [Tests et Qualité](#tests-et-qualité)

---

## 🎯 Principes Fondamentaux

### 1. Domain-Driven Design (DDD)

Organisez les packages par domaine métier plutôt que par type technique :

```
✅ BON:
packages/
├── reseau/          # Domaine: Réseau de contacts
├── transactions/    # Domaine: Transactions immobilières
└── billing/         # Domaine: Facturation

❌ MAUVAIS:
packages/
├── api/             # Technique: API
├── components/      # Technique: Composants
└── utils/           # Technique: Utilitaires
```

### 2. Principe de Responsabilité Unique

Chaque package doit avoir une responsabilité claire et bien définie :

- **@immoassist/reseau** : Gestion des contacts réseau
- **@immoassist/transactions** : Gestion des transactions immobilières
- **@immoassist/ui** : Composants UI réutilisables (à créer)
- **@immoassist/config** : Configuration partagée (à créer)

### 3. Indépendance et Réutilisabilité

Les packages doivent être :
- **Indépendants** : Peuvent être utilisés seuls
- **Réutilisables** : Utilisables dans plusieurs apps
- **Testables** : Tests isolés par package

---

## 📁 Structure Recommandée

### Architecture Complète

```
immoassist/
├── apps/
│   ├── web/                    # Application Next.js principale
│   └── admin/                  # Application admin (optionnel)
│
├── packages/
│   ├── ui/                     # 🆕 Composants UI partagés
│   │   ├── src/
│   │   │   ├── components/    # Composants React réutilisables
│   │   │   ├── hooks/          # Hooks React partagés
│   │   │   └── styles/         # Styles partagés
│   │   └── package.json
│   │
│   ├── reseau/                 # ✅ Module Réseau
│   │   ├── src/
│   │   │   ├── api/            # Client API
│   │   │   ├── types/          # Types TypeScript
│   │   │   ├── components/    # Composants spécifiques au réseau
│   │   │   └── hooks/          # Hooks spécifiques au réseau
│   │   └── package.json
│   │
│   ├── transactions/           # ✅ Module Transactions
│   │   ├── src/
│   │   │   ├── api/            # Client API
│   │   │   ├── types/          # Types TypeScript
│   │   │   ├── components/    # Composants spécifiques aux transactions
│   │   │   ├── hooks/          # Hooks spécifiques aux transactions
│   │   │   └── lib/            # Utilitaires (progression, etc.)
│   │   └── package.json
│   │
│   ├── config/                 # 🆕 Configuration partagée
│   │   ├── src/
│   │   │   ├── eslint/         # Config ESLint
│   │   │   ├── typescript/     # Config TypeScript
│   │   │   ├── tailwind/       # Config Tailwind
│   │   │   └── vitest/         # Config Vitest
│   │   └── package.json
│   │
│   └── types/                  # ✅ Types partagés (existant)
│       └── src/
│
├── backend/                    # Backend FastAPI
│   └── app/
│       ├── api/v1/endpoints/
│       │   ├── reseau/         # Endpoints Réseau
│       │   └── transactions/   # Endpoints Transactions
│       └── models/
│
├── turbo.json                  # Configuration TurboRepo
├── pnpm-workspace.yaml         # Configuration pnpm
└── tsconfig.base.json          # Config TypeScript partagée
```

---

## 📦 Organisation des Packages

### Structure Standard d'un Package

Chaque package doit suivre cette structure :

```
package-name/
├── src/
│   ├── index.ts                # Point d'entrée principal
│   ├── api/                    # Clients API (si applicable)
│   │   └── index.ts
│   ├── types/                  # Types TypeScript
│   │   └── index.ts
│   ├── components/             # Composants React (si applicable)
│   │   └── index.ts
│   ├── hooks/                  # Hooks React (si applicable)
│   │   └── index.ts
│   └── lib/                    # Utilitaires et helpers
│       └── index.ts
│
├── dist/                       # Build output (généré)
│
├── package.json                # Configuration du package
├── tsconfig.json               # Config TypeScript
├── README.md                   # Documentation
└── .eslintrc.js               # Config ESLint (optionnel)
```

### Exports dans package.json

```json
{
  "name": "@immoassist/reseau",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./api": {
      "types": "./dist/api/index.d.ts",
      "default": "./dist/api/index.js"
    },
    "./components": {
      "types": "./dist/components/index.d.ts",
      "default": "./dist/components/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/types/index.js"
    }
  }
}
```

---

## 🔀 Séparation des Responsabilités

### Niveaux d'Abstraction

```
┌─────────────────────────────────────────┐
│         apps/web (Application)          │  ← Pages, routing, app-specific logic
├─────────────────────────────────────────┤
│    packages/reseau (Domain Module)     │  ← Business logic, domain types
│    packages/transactions (Domain)       │
├─────────────────────────────────────────┤
│    packages/ui (Shared Components)     │  ← Reusable UI components
├─────────────────────────────────────────┤
│    packages/config (Configuration)      │  ← Shared configs
│    packages/types (Shared Types)       │
└─────────────────────────────────────────┘
```

### Règles de Dépendances

```
✅ AUTORISÉ:
- apps/web → packages/reseau
- apps/web → packages/transactions
- apps/web → packages/ui
- packages/transactions → packages/reseau (si besoin)
- packages/reseau → packages/ui
- packages/transactions → packages/ui

❌ INTERDIT:
- packages/ui → packages/reseau (UI ne doit pas dépendre du domaine)
- packages/config → packages/reseau (config ne doit pas dépendre du domaine)
- packages/reseau → packages/transactions (éviter les dépendances circulaires)
```

---

## 📚 Gestion des Dépendances

### Types de Dépendances

1. **dependencies** : Dépendances nécessaires en runtime
   ```json
   {
     "dependencies": {
       "axios": "^1.6.2",
       "react": "19.0.0"
     }
   }
   ```

2. **devDependencies** : Dépendances de développement uniquement
   ```json
   {
     "devDependencies": {
       "typescript": "^5.3.3",
       "@types/react": "^18.2.46"
     }
   }
   ```

3. **peerDependencies** : Dépendances fournies par l'application consommatrice
   ```json
   {
     "peerDependencies": {
       "react": "^18.0.0 || ^19.0.0",
       "react-dom": "^18.0.0 || ^19.0.0"
     }
   }
   ```

### Workspace Dependencies

Utilisez `workspace:*` pour les dépendances internes :

```json
{
  "dependencies": {
    "@immoassist/reseau": "workspace:*",
    "@immoassist/ui": "workspace:*"
  }
}
```

---

## ⚙️ Configuration Partagée

### TypeScript

**tsconfig.base.json** (racine) :
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": {
      "@immoassist/reseau": ["./packages/reseau/src"],
      "@immoassist/transactions": ["./packages/transactions/src"],
      "@immoassist/ui": ["./packages/ui/src"]
    }
  }
}
```

**packages/reseau/tsconfig.json** :
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"]
}
```

### ESLint

Créez `packages/config/src/eslint/base.js` :
```js
module.exports = {
  extends: ['next/core-web-vitals', 'prettier'],
  rules: {
    // Règles partagées
  }
};
```

### Tailwind CSS

Créez `packages/config/src/tailwind/base.js` :
```js
module.exports = {
  content: [
    '../../apps/**/*.{js,ts,jsx,tsx}',
    '../../packages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
};
```

---

## 🚀 Build et Cache

### Configuration TurboRepo

**turbo.json** :
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],  // Build les dépendances d'abord
      "outputs": ["dist/**", ".next/**"],
      "cache": true
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": [],
      "cache": true
    },
    "type-check": {
      "dependsOn": [],
      "cache": true
    },
    "test": {
      "dependsOn": ["^build"],
      "cache": true
    }
  }
}
```

### Scripts dans package.json

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vitest run",
    "clean": "rm -rf dist"
  }
}
```

---

## 🧪 Tests et Qualité

### Structure des Tests

```
package-name/
├── src/
│   └── api/
│       └── index.ts
└── src/
    └── __tests__/
        └── api/
            └── index.test.ts
```

### Configuration Vitest

**packages/config/src/vitest/base.ts** :
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Tests par Package

Chaque package doit avoir ses propres tests :

```bash
# Lancer les tests d'un package spécifique
pnpm --filter @immoassist/reseau test

# Lancer tous les tests
pnpm test
```

---

## 📝 Checklist pour un Nouveau Package

- [ ] Créer la structure de dossiers standard
- [ ] Configurer `package.json` avec les exports appropriés
- [ ] Créer `tsconfig.json` qui étend la config de base
- [ ] Ajouter un `README.md` avec documentation
- [ ] Configurer les scripts de build/test/lint
- [ ] Ajouter les dépendances nécessaires
- [ ] Créer les exports dans `src/index.ts`
- [ ] Ajouter les tests de base
- [ ] Mettre à jour `tsconfig.base.json` avec les paths
- [ ] Mettre à jour `pnpm-workspace.yaml` si nécessaire
- [ ] Documenter l'usage dans la doc principale

---

## 🎯 Prochaines Étapes Recommandées

### 1. Créer le Package UI Partagé

```bash
packages/ui/
├── src/
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   └── Input/
│   └── index.ts
```

### 2. Créer le Package Config

```bash
packages/config/
├── src/
│   ├── eslint/
│   ├── typescript/
│   ├── tailwind/
│   └── vitest/
```

### 3. Migrer les Composants UI

Déplacer les composants réutilisables de `apps/web/src/components/ui/` vers `packages/ui/`.

### 4. Ajouter les Hooks Partagés

Créer `packages/ui/src/hooks/` pour les hooks réutilisables.

---

## 📖 Ressources

- [TurboRepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)

---

## ✅ Résumé des Meilleures Pratiques

1. ✅ **Organisation par domaine** plutôt que par type technique
2. ✅ **Packages indépendants** et réutilisables
3. ✅ **Configuration partagée** pour éviter la duplication
4. ✅ **Build optimisé** avec cache TurboRepo
5. ✅ **Tests isolés** par package
6. ✅ **Documentation claire** pour chaque package
7. ✅ **Gestion stricte des dépendances** (éviter les cycles)
8. ✅ **Exports bien définis** dans package.json
