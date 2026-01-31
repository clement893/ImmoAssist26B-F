# Guide d'Intégration du Module Réseau depuis NUKLEO-ERP

## Étapes pour intégrer le module Réseau

### Option 1: Cloner le repo temporairement (Recommandé)

```bash
# 1. Cloner le repo NUKLEO-ERP dans un dossier temporaire
cd C:\Users\cleme
git clone <URL-du-repo-NUKLEO-ERP> nukleo-erp-temp

# 2. Trouver le module Réseau
# Il devrait être dans:
# - backend/app/modules/reseau (si backend)
# - packages/reseau (si frontend/shared)
# - apps/web/src/app/reseau (si frontend)

# 3. Utiliser le script de migration
cd modele-final-1
pnpm migrate:module C:\Users\cleme\nukleo-erp-temp\<chemin-vers-reseau> reseau --type <frontend|backend|shared>

# 4. Nettoyer (optionnel)
rm -rf C:\Users\cleme\nukleo-erp-temp
```

### Option 2: Utiliser Git Submodule (Pour synchronisation continue)

```bash
# 1. Ajouter le repo comme submodule
git submodule add <URL-du-repo-NUKLEO-ERP> external/nukleo-erp

# 2. Naviguer vers le module
cd external/nukleo-erp

# 3. Trouver et copier le module Réseau
# (suivre les étapes de migration)
```

### Option 3: Copie manuelle

```bash
# 1. Cloner ou accéder au repo NUKLEO-ERP
# 2. Copier le module Réseau localement
# 3. Utiliser le script de migration
```
