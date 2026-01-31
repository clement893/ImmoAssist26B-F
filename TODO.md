# 📋 Liste des TODOs et Améliorations

Ce fichier documente tous les TODOs, FIXMEs et améliorations identifiés dans le codebase.

> **Note**: Ce fichier est maintenu manuellement. Les TODOs dans le code source peuvent être plus à jour.

## 🔴 Priorité Haute

### 1. Intégration API Manquante

#### Pages Content Management
- **Fichier**: `docs/APP_PAGES_AND_FEATURES.md`
- **Localisation**: `/content/pages`, `/pages/[slug]`, `/content/pages/[slug]/edit`, `/content/pages/[slug]/preview`
- **Description**: Ces pages nécessitent une intégration API complète
- **Status**: ⚠️ TODO: Needs API integration
- **Action**: Implémenter les endpoints backend et connecter le frontend

#### Validation Media
- **Fichier**: `apps/web/src/app/upload/page.tsx` (ligne 88)
- **Description**: TODO: Create /v1/media/validate endpoint in backend when needed
- **Status**: ⚠️ Backend endpoint manquant
- **Action**: Créer l'endpoint `/v1/media/validate` dans le backend

## 🟡 Priorité Moyenne

### 2. Améliorations du Thème

#### Cache Script
- **Fichier**: `apps/web/src/lib/theme/theme-inline-cache-script.ts`
- **Description**: Améliorations possibles du système de cache des thèmes
- **Status**: À revoir
- **Action**: Optimiser le système de cache pour de meilleures performances

### 3. Tests et Coverage

#### Tests Manquants
- **Description**: Certains composants peuvent manquer de tests
- **Status**: À vérifier
- **Action**: 
  - Exécuter `pnpm test:coverage` pour identifier les zones non couvertes
  - Ajouter des tests pour les composants critiques

## 🟢 Priorité Basse

### 4. Documentation

#### Documentation Incomplète
- **Fichier**: `docs/APP_PAGES_AND_FEATURES.md`
- **Description**: Certaines fonctionnalités sont documentées mais pas complètement implémentées
- **Status**: Documentation à mettre à jour
- **Action**: Marquer comme "à venir" ou compléter l'implémentation

### 5. Optimisations

#### Performance
- **Description**: Optimisations possibles dans plusieurs composants
- **Status**: À analyser
- **Action**: 
  - Exécuter `pnpm analyze` pour identifier les opportunités
  - Optimiser les bundles si nécessaire

## 📝 Comment Contribuer

Si vous trouvez un TODO dans le code:

1. **Créer une Issue GitHub** avec le label `todo`
2. **Mettre à jour ce fichier** avec les détails
3. **Référencer l'issue** dans le code source

### Format pour Ajouter un TODO

```markdown
### [Numéro]. [Titre]

- **Fichier**: `chemin/vers/fichier`
- **Ligne**: [numéro de ligne]
- **Description**: [description détaillée]
- **Status**: [🔴 Haute | 🟡 Moyenne | 🟢 Basse]
- **Action**: [action requise]
```

## 🔍 Recherche de TODOs

Pour trouver tous les TODOs dans le code:

```bash
# Rechercher les TODOs
grep -r "TODO\|FIXME\|XXX\|HACK" --include="*.ts" --include="*.tsx" --include="*.py" apps/ backend/

# Exclure les fichiers de test et stories
grep -r "TODO\|FIXME" --include="*.ts" --include="*.tsx" --exclude-dir="__tests__" --exclude-dir="*.stories.*" apps/web/src/
```

## ✅ TODOs Complétés

Les TODOs complétés seront déplacés ici avec la date de complétion:

- [Aucun pour le moment]

---

**Dernière mise à jour**: 2025-01-27
