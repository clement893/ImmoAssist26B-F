# Guide d'Intégration de Modules Externes

Ce guide explique comment importer et intégrer des modules d'un autre projet créé avec ce template de manière sûre et maintenable.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Méthodes d'intégration](#méthodes-dintégration)
3. [Approche recommandée](#approche-recommandée)
4. [Checklist de migration](#checklist-de-migration)
5. [Gestion des conflits](#gestion-des-conflits)

## Vue d'ensemble

Lorsque vous voulez importer un module d'un autre projet créé avec ce template, plusieurs approches sont possibles. Le choix dépend de:

- La taille et la complexité du module
- La fréquence des mises à jour
- Le besoin de maintenir la synchronisation
- La compatibilité des versions

## Méthodes d'intégration

### 1. 📦 Package npm Local (Recommandé pour modules réutilisables)

**Avantages:**

- ✅ Isolation complète
- ✅ Versioning indépendant
- ✅ Réutilisable dans plusieurs projets
- ✅ Tests et builds indépendants

**Inconvénients:**

- ⚠️ Nécessite une structure de package
- ⚠️ Gestion des dépendances

**Étapes:**

#### 1.1 Créer un package dans le monorepo

```bash
# Créer la structure
mkdir -p packages/votre-module
cd packages/votre-module
```

#### 1.2 Créer `package.json`

```json
{
  "name": "@modele/votre-module",
  "version": "1.0.0",
  "description": "Description du module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // Dépendances spécifiques au module
  },
  "peerDependencies": {
    // Dépendances partagées avec le projet principal
    "react": "^18.0.0",
    "next": "^14.0.0"
  }
}
```

#### 1.3 Créer `tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"]
}
```

#### 1.4 Copier le code du module externe

```bash
# Depuis le projet source
cp -r /chemin/vers/projet-externe/module/* packages/votre-module/src/
```

#### 1.5 Ajouter au workspace

Le workspace est déjà configuré dans `pnpm-workspace.yaml`, donc le package sera automatiquement détecté.

#### 1.6 Installer et utiliser

```bash
# Installer les dépendances
pnpm install

# Dans apps/web/package.json, ajouter:
{
  "dependencies": {
    "@modele/votre-module": "workspace:*"
  }
}
```

```typescript
// Utilisation dans le code
import { ModuleComponent } from "@modele/votre-module";
```

---

### 2. 🔗 Git Submodule (Recommandé pour modules partagés)

**Avantages:**

- ✅ Synchronisation avec le projet source
- ✅ Historique Git préservé
- ✅ Mises à jour faciles

**Inconvénients:**

- ⚠️ Complexité de gestion
- ⚠️ Risque de conflits

**Étapes:**

#### 2.1 Ajouter le submodule

```bash
# Ajouter le submodule dans un dossier dédié
git submodule add https://github.com/user/projet-externe.git packages/external-modules/projet-externe

# Initialiser et mettre à jour
git submodule update --init --recursive
```

#### 2.2 Créer un wrapper package

```bash
mkdir -p packages/votre-module
```

Créer `packages/votre-module/package.json`:

```json
{
  "name": "@modele/votre-module",
  "version": "1.0.0",
  "main": "../external-modules/projet-externe/dist/index.js",
  "types": "../external-modules/projet-externe/dist/index.d.ts"
}
```

#### 2.3 Mettre à jour le submodule

```bash
# Mettre à jour vers la dernière version
cd packages/external-modules/projet-externe
git pull origin main
cd ../../..
git add packages/external-modules/projet-externe
git commit -m "Update submodule"
```

---

### 3. 📁 Copie avec Script de Migration (Recommandé pour intégration unique)

**Avantages:**

- ✅ Contrôle total
- ✅ Adaptation facile au projet
- ✅ Pas de dépendances externes

**Inconvénients:**

- ⚠️ Pas de synchronisation automatique
- ⚠️ Maintenance manuelle

**Étapes:**

#### 3.1 Créer un script de migration

Créer `scripts/migrate-module.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Script de migration de module externe
 * Usage: node scripts/migrate-module.js <chemin-source> <nom-module>
 */

const [sourcePath, moduleName] = process.argv.slice(2);

if (!sourcePath || !moduleName) {
  console.error(
    "Usage: node scripts/migrate-module.js <chemin-source> <nom-module>",
  );
  process.exit(1);
}

const targetPath = path.join(__dirname, "..", "packages", moduleName);

console.log(`📦 Migration du module: ${moduleName}`);
console.log(`Source: ${sourcePath}`);
console.log(`Destination: ${targetPath}`);

// Créer la structure
if (!fs.existsSync(targetPath)) {
  fs.mkdirSync(targetPath, { recursive: true });
}

// Fonction pour adapter les imports
function adaptImports(content, sourceDir, targetDir) {
  // Adapter les imports relatifs
  // Adapter les imports de packages
  // Adapter les chemins de ressources

  return content
    .replace(/from ['"]@modele\/types['"]/g, "from '@modele/types'")
    .replace(/from ['"]\.\.\/\.\.\/lib\//g, "from '@/lib/");
  // Ajouter d'autres adaptations selon vos besoins
}

// Copier et adapter les fichiers
function copyAndAdapt(src, dest) {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach((file) => {
      copyAndAdapt(path.join(src, file), path.join(dest, file));
    });
  } else {
    let content = fs.readFileSync(src, "utf8");

    // Adapter le contenu selon le type de fichier
    if (
      src.endsWith(".ts") ||
      src.endsWith(".tsx") ||
      src.endsWith(".js") ||
      src.endsWith(".jsx")
    ) {
      content = adaptImports(content, sourcePath, targetPath);
    }

    fs.writeFileSync(dest, content);
  }
}

// Copier les fichiers
copyAndAdapt(sourcePath, targetPath);

// Créer package.json si nécessaire
const packageJsonPath = path.join(targetPath, "package.json");
if (!fs.existsSync(packageJsonPath)) {
  const packageJson = {
    name: `@modele/${moduleName}`,
    version: "1.0.0",
    main: "./dist/index.js",
    types: "./dist/index.d.ts",
    scripts: {
      build: "tsc",
      dev: "tsc --watch",
      "type-check": "tsc --noEmit",
    },
  };
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

console.log("✅ Migration terminée!");
console.log(`📝 Vérifiez et adaptez le code dans: ${targetPath}`);
```

#### 3.2 Utiliser le script

```bash
node scripts/migrate-module.js /chemin/vers/module-externe nom-du-module
```

---

### 4. 🔌 Système de Plugins (Recommandé pour extensibilité)

**Avantages:**

- ✅ Architecture extensible
- ✅ Modules optionnels
- ✅ Chargement dynamique

**Inconvénients:**

- ⚠️ Complexité initiale
- ⚠️ Nécessite une architecture spécifique

**Étapes:**

#### 4.1 Créer l'interface de plugin

`packages/plugin-system/src/types.ts`:

```typescript
export interface ModulePlugin {
  name: string;
  version: string;
  initialize: (context: PluginContext) => Promise<void>;
  routes?: RouteConfig[];
  components?: ComponentConfig[];
  apiEndpoints?: ApiEndpointConfig[];
}

export interface PluginContext {
  registerRoute: (route: RouteConfig) => void;
  registerComponent: (component: ComponentConfig) => void;
  registerApiEndpoint: (endpoint: ApiEndpointConfig) => void;
}
```

#### 4.2 Créer le gestionnaire de plugins

`packages/plugin-system/src/manager.ts`:

```typescript
import type { ModulePlugin } from "./types";

class PluginManager {
  private plugins: Map<string, ModulePlugin> = new Map();

  async loadPlugin(plugin: ModulePlugin) {
    // Validation
    // Initialisation
    // Enregistrement
    this.plugins.set(plugin.name, plugin);
  }

  getPlugin(name: string): ModulePlugin | undefined {
    return this.plugins.get(name);
  }
}

export const pluginManager = new PluginManager();
```

#### 4.3 Utiliser dans l'application

```typescript
// apps/web/src/lib/plugins/loader.ts
import { pluginManager } from "@modele/plugin-system";
import { ExternalModule } from "@modele/external-module";

export async function loadPlugins() {
  await pluginManager.loadPlugin(ExternalModule);
}
```

---

## Approche recommandée

Pour la plupart des cas, nous recommandons l'**Approche 1 (Package npm Local)** car elle offre:

1. ✅ Isolation et testabilité
2. ✅ Réutilisabilité
3. ✅ Versioning indépendant
4. ✅ Intégration facile avec le monorepo existant

### Workflow complet recommandé

```bash
# 1. Créer le package
mkdir -p packages/votre-module/src
cd packages/votre-module

# 2. Initialiser le package
pnpm init

# 3. Configurer TypeScript
# (copier tsconfig.json depuis packages/types)

# 4. Copier le code du module externe
cp -r /chemin/vers/module-externe/* src/

# 5. Adapter les imports
# Utiliser find/replace ou le script de migration

# 6. Installer les dépendances
pnpm install

# 7. Build
pnpm build

# 8. Ajouter au projet principal
# Dans apps/web/package.json:
# "@modele/votre-module": "workspace:*"

# 9. Utiliser dans le code
# import { ... } from '@modele/votre-module'
```

## Checklist de migration

Avant d'intégrer un module externe, vérifiez:

### ✅ Compatibilité

- [ ] Versions de Node.js compatibles
- [ ] Versions de dépendances compatibles (React, Next.js, etc.)
- [ ] Structure de projet compatible
- [ ] TypeScript config compatible

### ✅ Adaptations nécessaires

- [ ] Imports relatifs → imports de packages
- [ ] Chemins de ressources (images, CSS, etc.)
- [ ] Variables d'environnement
- [ ] Configuration spécifique au projet source
- [ ] Types et interfaces partagés

### ✅ Tests et validation

- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Build TypeScript réussit
- [ ] Build Next.js réussit
- [ ] Pas d'erreurs de linting
- [ ] Fonctionnalités testées manuellement

### ✅ Documentation

- [ ] README du module mis à jour
- [ ] Types exportés documentés
- [ ] Exemples d'utilisation ajoutés
- [ ] Changelog créé

## Gestion des conflits

### Conflits de dépendances

Si le module externe utilise des versions différentes de dépendances:

```bash
# Utiliser peerDependencies dans le package du module
{
  "peerDependencies": {
    "react": "^18.0.0",
    "next": "^14.0.0"
  }
}
```

### Conflits de noms

Si des noms de fonctions/composants entrent en conflit:

```typescript
// Utiliser des alias d'import
import { Button as ExternalButton } from "@modele/external-module";
import { Button } from "@/components/ui/button";
```

### Conflits de routes API

Si des routes API entrent en conflit:

```python
# Backend: Préfixer les routes du module
router = APIRouter(prefix="/api/v1/external-module")
```

### Conflits de types

Si des types entrent en conflit:

```typescript
// Utiliser des namespaces ou préfixes
import * as ExternalModule from "@modele/external-module";
type MyType = ExternalModule.SomeType;
```

## Exemples pratiques

### Exemple 1: Intégrer un module de gestion de tâches

```bash
# 1. Créer le package
mkdir -p packages/task-manager/src

# 2. Copier le code
cp -r /autre-projet/packages/task-manager/* packages/task-manager/src/

# 3. Adapter package.json
cd packages/task-manager
# Modifier les imports dans le code

# 4. Build
pnpm build

# 5. Utiliser
# Dans apps/web/src/app/tasks/page.tsx
import { TaskList } from '@modele/task-manager';
```

### Exemple 2: Intégrer un module backend Python

```bash
# 1. Copier le module
cp -r /autre-projet/backend/app/modules/task_manager backend/app/modules/

# 2. Adapter les imports
# Modifier les imports dans les fichiers Python

# 3. Ajouter au __init__.py
# backend/app/models/__init__.py
from app.modules.task_manager.models import Task, TaskStatus

# 4. Créer les migrations
cd backend
alembic revision --autogenerate -m "Add task manager module"
alembic upgrade head

# 5. Générer les types TypeScript
pnpm generate:types
```

## Scripts utiles

### Script de vérification de compatibilité

Créer `scripts/check-module-compatibility.js`:

```javascript
#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function checkCompatibility(modulePath) {
  // Vérifier package.json
  // Vérifier tsconfig.json
  // Vérifier les dépendances
  // Vérifier la structure
}

checkCompatibility(process.argv[2]);
```

### Script d'adaptation automatique

Créer `scripts/adapt-module-imports.js`:

```javascript
#!/usr/bin/env node

// Adapter automatiquement les imports dans un module
// Remplacer les imports relatifs par des imports de packages
```

## Ressources

- [Documentation pnpm workspaces](https://pnpm.io/workspaces)
- [Documentation TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Git Submodules](https://git-scm.com/book/en/v2/Git-Tools-Submodules)

## Support

Pour toute question ou problème lors de l'intégration d'un module, consultez:

- La documentation du module source
- Les issues GitHub du projet source
- La documentation de ce template
