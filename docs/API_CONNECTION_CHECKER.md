# 🔍 Outil de Vérification des Connexions API

Guide complet pour utiliser les outils automatisés de vérification des connexions API.

---

## 📋 Vue d'Ensemble

Trois scripts ont été créés pour automatiser la vérification des connexions API :

1. **`check-api-connections.js`** - Vérifie les connexions frontend
2. **`check-api-connections-backend.js`** - Vérifie les endpoints backend
3. **`generate-api-connection-report.js`** - Génère un rapport markdown

---

## 🚀 Utilisation Rapide

### Vérification Basique

```bash
# Vérifier toutes les connexions API
pnpm api:check

# Vérification détaillée avec toutes les informations
pnpm api:check:detailed

# Vérifier uniquement les endpoints backend
pnpm api:check:backend

# Générer un rapport markdown
pnpm api:report
```

### Commandes Directes

```bash
# Vérification basique
node scripts/check-api-connections.js

# Vérification détaillée
node scripts/check-api-connections.js --detailed

# Vérifier une page spécifique
node scripts/check-api-connections.js --page /content/pages

# Vérifier backend
node scripts/check-api-connections-backend.js

# Générer rapport avec nom personnalisé
node scripts/generate-api-connection-report.js --output MON_RAPPORT.md
```

---

## 📊 Ce Que Fait Chaque Script

### 1. `check-api-connections.js`

**Fonctionnalités** :

- ✅ Scanne tous les fichiers `page.tsx` et `page.ts`
- ✅ Détecte les appels API directs (`apiClient.get()`, etc.)
- ✅ Détecte les appels API via modules (`pagesAPI.list()`, etc.)
- ✅ Détecte les TODOs liés aux API
- ✅ Vérifie si les modules API existent
- ✅ Vérifie si les fonctions API existent dans les modules
- ✅ Vérifie si les endpoints backend existent
- ✅ Génère un rapport de statut

**Sortie** :

```
📊 API Connection Status Report
================================================================================

📈 Summary:
  Total pages analyzed: 150
  ✅ Connected: 120
  ⚠️  Partial: 15
  ❌ Needs integration: 10
  🟡 Static: 5

❌ Pages Needing API Integration:
  - /content/pages
  - /forms/[id]/submissions
  ...
```

**Codes de sortie** :

- `0` : Tout est connecté
- `1` : Des pages nécessitent une intégration

### 2. `check-api-connections-backend.js`

**Fonctionnalités** :

- ✅ Scanne tous les fichiers Python dans `backend/app/api/v1/endpoints`
- ✅ Extrait tous les endpoints (`@router.get()`, `@router.post()`, etc.)
- ✅ Vérifie si les modules sont enregistrés dans le router principal
- ✅ Liste tous les endpoints par module

**Sortie** :

```
🔍 Scanning backend endpoints...

📊 Found 150 endpoints in 25 modules

🔍 Checking router registration...

📈 Summary:
  ✅ Registered modules: 23
  ❌ Unregistered modules: 2

❌ Unregistered Modules:
  - surveys
  - reports

📋 Endpoints by Module:

✅ pages (5 endpoints)
    GET /api/v1/pages
    POST /api/v1/pages
    ...
```

### 3. `generate-api-connection-report.js`

**Fonctionnalités** :

- ✅ Analyse toutes les pages
- ✅ Génère un rapport markdown complet
- ✅ Inclut le statut de chaque page
- ✅ Liste les TODOs et problèmes
- ✅ Format prêt pour documentation

**Sortie** :
Fichier markdown avec :

- Résumé statistique
- Liste des pages nécessitant une intégration
- Liste des pages avec connexions partielles
- Liste des pages connectées
- Analyse détaillée de chaque page

---

## 🔍 Détails Techniques

### Détection des Appels API

Le script détecte plusieurs patterns :

#### 1. Appels API Directs

```typescript
// Détecté comme: GET /api/v1/pages
apiClient.get("/v1/pages");

// Détecté comme: POST /api/v1/pages
apiClient.post("/v1/pages", data);
```

#### 2. Appels via Modules API

```typescript
// Détecté comme: pagesAPI.list()
import { pagesAPI } from "@/lib/api/pages";
pagesAPI.list();

// Détecté comme: formsAPI.getSubmissions()
formsAPI.getSubmissions(formId);
```

#### 3. TODOs

```typescript
// Détecté comme TODO
// TODO: Load pages from API
// FIXME: Connect to API
```

### Vérifications Effectuées

Pour chaque page :

1. **Détection des appels API**
   - Appels directs via `apiClient`
   - Appels via modules API
   - Présence de TODOs

2. **Vérification Frontend**
   - Module API existe-t-il ? (`lib/api/[module].ts`)
   - Fonction API existe-t-elle dans le module ?

3. **Vérification Backend**
   - Endpoint existe-t-il dans le backend ?
   - Endpoint est-il enregistré dans le router ?

### Statuts Possibles

- **`connected`** : Page connectée, tout fonctionne ✅
- **`partial`** : Connexions partielles, certains problèmes ⚠️
- **`needs-integration`** : Nécessite une intégration API ❌
- **`static`** : Page statique, pas d'API nécessaire 🟡

---

## 📝 Exemples d'Utilisation

### Exemple 1 : Vérification Rapide

```bash
# Vérifier l'état général
pnpm api:check

# Si des problèmes sont détectés, voir les détails
pnpm api:check:detailed
```

### Exemple 2 : Vérifier une Page Spécifique

```bash
# Vérifier uniquement la page /content/pages
node scripts/check-api-connections.js --page /content/pages
```

### Exemple 3 : Générer un Rapport pour Documentation

```bash
# Générer un rapport complet
pnpm api:report

# Le rapport sera dans API_CONNECTION_REPORT.md
# Vous pouvez l'inclure dans votre documentation
```

### Exemple 4 : Vérifier le Backend

```bash
# Vérifier que tous les endpoints sont enregistrés
pnpm api:check:backend

# Cela vous dira quels modules ne sont pas enregistrés dans le router
```

---

## 🔧 Intégration dans le Workflow

### Dans le Plan par Batch

Utiliser les scripts à chaque étape :

```bash
# Avant de commencer un batch
pnpm api:check > before-batch-X.txt

# Après avoir complété un batch
pnpm api:check > after-batch-X.txt

# Comparer les résultats
diff before-batch-X.txt after-batch-X.txt
```

### Dans CI/CD

Ajouter dans `.github/workflows/ci.yml` :

```yaml
- name: Check API Connections
  run: |
    pnpm api:check
    # Le script exit avec code 1 si des problèmes sont trouvés
    # Cela fera échouer le CI
```

### Dans les Pre-commit Hooks

Ajouter dans `scripts/pre-commit.js` :

```javascript
// Vérifier les connexions API avant commit
const { execSync } = require("child_process");
try {
  execSync("pnpm api:check", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Some pages need API integration!");
  process.exit(1);
}
```

---

## 📊 Interprétation des Résultats

### Résumé

```
📈 Summary:
  Total pages analyzed: 150
  ✅ Connected: 120        ← Pages complètement connectées
  ⚠️  Partial: 15          ← Pages avec problèmes mineurs
  ❌ Needs integration: 10 ← Pages nécessitant du travail
  🟡 Static: 5             ← Pages statiques (normal)
```

### Pages "Needs Integration"

Ces pages ont des TODOs mais pas d'appels API :

- Action : Intégrer les appels API selon le plan par batch

### Pages "Partial"

Ces pages ont des appels API mais des problèmes :

- Module API manquant
- Fonction API manquante
- Endpoint backend manquant
- Action : Corriger les problèmes identifiés

### Pages "Connected"

Ces pages sont complètement connectées :

- Tout fonctionne correctement
- Aucune action nécessaire

---

## 🐛 Résolution des Problèmes

### Problème : "Module API not found"

**Solution** :

1. Vérifier que le fichier existe : `apps/web/src/lib/api/[module].ts`
2. Si n'existe pas, créer le module selon le plan par batch
3. Vérifier l'import dans la page

### Problème : "Function not found in module"

**Solution** :

1. Ouvrir le module API
2. Vérifier que la fonction existe
3. Vérifier le nom exact (case-sensitive)
4. Ajouter la fonction si manquante

### Problème : "Backend endpoint not found"

**Solution** :

1. Vérifier que l'endpoint existe dans le backend
2. Utiliser `pnpm api:check:backend` pour voir tous les endpoints
3. Créer l'endpoint si manquant
4. Vérifier qu'il est enregistré dans le router

---

## 📈 Métriques et Statistiques

Le script génère automatiquement :

- **Taux de connexion** : `connected / total * 100`
- **Pages à traiter** : `needs-integration + partial`
- **Progression** : Comparaison avant/après chaque batch

### Exemple de Suivi

```bash
# Avant Batch 1
pnpm api:check
# Needs integration: 15

# Après Batch 1
pnpm api:check
# Needs integration: 11  ← 4 pages connectées !

# Après Batch 2
pnpm api:check
# Needs integration: 7   ← 4 autres pages connectées !
```

---

## 🎯 Utilisation dans le Plan par Batch

### Workflow Recommandé

1. **Avant chaque batch**

   ```bash
   pnpm api:check > status-before-batch-X.txt
   ```

2. **Pendant le développement**

   ```bash
   # Vérifier après chaque page modifiée
   node scripts/check-api-connections.js --page /path/to/page
   ```

3. **Avant de committer**

   ```bash
   pnpm api:check
   # S'assurer qu'il n'y a pas de régressions
   ```

4. **Après le batch**

   ```bash
   pnpm api:check > status-after-batch-X.txt
   pnpm api:report --output BATCH_X_REPORT.md
   ```

5. **Comparer les résultats**
   ```bash
   diff status-before-batch-X.txt status-after-batch-X.txt
   ```

---

## 🔄 Automatisation

### Script de Vérification Complète

Créer `scripts/verify-all-api-connections.sh` :

```bash
#!/bin/bash

echo "🔍 Checking API Connections..."
echo ""

echo "1. Frontend connections..."
pnpm api:check

echo ""
echo "2. Backend endpoints..."
pnpm api:check:backend

echo ""
echo "3. Generating report..."
pnpm api:report

echo ""
echo "✅ Verification complete!"
```

### Ajouter au package.json

```json
{
  "scripts": {
    "api:verify": "bash scripts/verify-all-api-connections.sh"
  }
}
```

---

## 📚 Ressources

- **Plan d'intégration**: `API_INTEGRATION_BATCH_PLAN.md`
- **Workflow**: `API_INTEGRATION_WORKFLOW_EXPLANATION.md`
- **Liste des pages**: `APP_PAGES_AND_FEATURES.md`

---

## 🔄 Mises à Jour Récentes (2025-01-28)

### Corrections Appliquées

- ✅ **9 nouveaux endpoints créés** pour correspondre aux appels frontend
- ✅ **5 fetch() calls convertis** en `apiClient` pour la cohérence
- ✅ **15 fichiers corrigés** avec préfixes dupliqués dans les chemins API
- ✅ **Tous les endpoints critiques vérifiés** (auth, RBAC, DELETE)

### Nouveaux Endpoints Disponibles

- User Preferences: `/v1/users/preferences/notifications` (GET, PUT)
- Admin/Tenancy: `/v1/admin/tenancy/config` (GET, PUT)
- Media Validation: `/v1/media/validate` (POST)
- Tags CRUD: `/v1/tags/` (GET, PUT, DELETE)
- Scheduled Tasks: `/v1/scheduled-tasks/{id}/toggle` (PUT)
- Pages: `/v1/pages/id/{id}` (DELETE)

### Bonnes Pratiques

1. **Utiliser `apiClient`** au lieu de `fetch()` pour tous les appels API
2. **Chemins normalisés** sans préfixes dupliqués (`/v1/resource` pas `/api/v1/resource/resource`)
3. **Utiliser `extractApiData`** pour extraire les données des réponses API

---

_Document créé le: [Date]_  
_Dernière mise à jour: 2025-01-28_
