# 📊 Guide du Dashboard Sentry - Où trouver vos erreurs

Ce guide vous explique où trouver les erreurs dans votre dashboard Sentry après avoir effectué un test.

## 🎯 Où trouver les erreurs dans Sentry

### 1. Section principale : **Issues** (Problèmes)

Les erreurs apparaissent dans la section **Issues** du dashboard Sentry :

1. **Connectez-vous à Sentry** : https://sentry.io
2. **Sélectionnez votre organisation** (en haut à gauche)
3. **Sélectionnez votre projet** (dans le menu de gauche ou en haut)
4. **Cliquez sur "Issues"** dans le menu de gauche (ou allez directement sur la page d'accueil du projet)

### 2. Structure de la page Issues

Sur la page Issues, vous verrez :

- **Liste des erreurs** : Toutes les erreurs capturées, triées par défaut par "Newest" (plus récentes)
- **Filtres** : En haut de la liste, vous pouvez filtrer par :
  - **Environment** (environnement) : `development`, `production`, etc.
  - **Status** : `Unresolved`, `Resolved`, `Ignored`
  - **Level** : `error`, `warning`, `info`
  - **Tags** : Tags personnalisés (comme `test: true`)
  - **Date range** : Période de temps

### 3. Détails d'une erreur

Quand vous cliquez sur une erreur dans la liste, vous verrez :

- **Titre de l'erreur** : Le message d'erreur
- **Stack trace** : La pile d'appels montrant où l'erreur s'est produite
- **Breadcrumbs** : Les événements qui ont précédé l'erreur
- **Tags** : Les tags associés (comme `test: true`, `page: test-sentry`)
- **Extra Data** : Les données supplémentaires envoyées
- **User Context** : Informations sur l'utilisateur (si définies)
- **Environment** : L'environnement où l'erreur s'est produite
- **Release** : La version de l'application

## 🔍 Comment vérifier que vos erreurs sont bien envoyées

### Méthode 1 : Vérifier dans le navigateur (DevTools)

1. Ouvrez les **DevTools** (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Filtrez par **"sentry"** ou **"ingest"**
4. Cliquez sur un bouton de test dans `/sentry/test`
5. Vous devriez voir une requête POST vers `https://*.ingest.sentry.io/api/*/envelope/`
6. Vérifiez que la requête a un **status 200** (succès)

### Méthode 2 : Activer le mode debug

Ajoutez dans votre `.env.local` :

```env
NEXT_PUBLIC_SENTRY_DEBUG=true
SENTRY_DEBUG=true
```

Puis redémarrez votre serveur. Vous verrez dans la console du navigateur des messages comme :

- `[Sentry] [Debug] Sending event to Sentry`
- `[Sentry] [Debug] Event sent successfully`

### Méthode 3 : Vérifier les filtres dans Sentry

Si vous ne voyez pas vos erreurs, vérifiez les filtres dans Sentry :

1. Allez dans **Settings** → **Projects** → Votre projet
2. Cliquez sur **"Inbound Filters"** dans le menu de gauche
3. Vérifiez que les filtres ne bloquent pas vos erreurs de test

## ⚠️ Problème courant : Erreurs non visibles en développement

**Par défaut, Sentry ne capture PAS les erreurs en développement !**

### Solution : Activer Sentry en développement

Ajoutez dans votre `.env.local` :

```env
NEXT_PUBLIC_SENTRY_ENABLE_DEV=true
SENTRY_ENABLE_DEV=true
```

**Important** : Redémarrez votre serveur de développement après avoir ajouté cette variable !

### Vérifier votre environnement

Dans la page de test Sentry (`/sentry/test`), vous verrez :

- **Environment** : Doit être `development` (ou `production`)
- **Sentry Enabled in Dev** : Doit être `true` si vous testez en développement

## 📋 Checklist pour trouver vos erreurs

- [ ] Vous avez activé `NEXT_PUBLIC_SENTRY_ENABLE_DEV=true` si vous testez en développement
- [ ] Vous avez redémarré le serveur après avoir modifié les variables d'environnement
- [ ] Vous avez vérifié que `NEXT_PUBLIC_SENTRY_DSN` est bien défini
- [ ] Vous avez testé avec la page `/sentry/test`
- [ ] Vous avez vérifié la section **Issues** dans Sentry (pas "Performance" ou "Releases")
- [ ] Vous avez vérifié les filtres dans Sentry (Environment, Status, etc.)
- [ ] Vous avez vérifié les requêtes réseau dans DevTools pour confirmer l'envoi

## 🎨 Navigation dans Sentry

### Menu principal (gauche)

- **Issues** ⭐ ← **C'est ici que vous trouverez vos erreurs !**
- **Performance** : Métriques de performance (pas les erreurs)
- **Releases** : Versions de l'application
- **Discover** : Requêtes personnalisées sur les données
- **Dashboards** : Tableaux de bord personnalisés
- **Alerts** : Alertes configurées
- **Settings** : Configuration du projet

### Filtres utiles dans Issues

- **Environment** : Filtrez par `development` ou `production`
- **Tags** : Recherchez `test:true` pour trouver vos erreurs de test
- **Search** : Recherchez par texte (ex: "Sentry Test Error")

## 🧪 Test recommandé

1. **Activez le mode développement** :

   ```env
   NEXT_PUBLIC_SENTRY_ENABLE_DEV=true
   NEXT_PUBLIC_SENTRY_DEBUG=true
   ```

2. **Redémarrez le serveur** :

   ```bash
   pnpm dev
   ```

3. **Allez sur** `/sentry/test` (ou `/fr/sentry/test`)

4. **Cliquez sur "Test Exception"**

5. **Attendez 5-10 secondes** (le temps que Sentry traite l'erreur)

6. **Allez dans Sentry** → **Issues** → **Filtrez par "Newest"**

7. **Vous devriez voir** une erreur avec le titre "Test exception from Sentry test page"

## 💡 Astuce : Créer un filtre personnalisé

Pour retrouver facilement vos erreurs de test :

1. Dans la page **Issues**, cliquez sur **"Add Filter"**
2. Sélectionnez **"Tags"** → **"test"** → **"true"**
3. Cliquez sur **"Save as Saved Search"**
4. Nommez-le "Test Errors"

Maintenant, vous pouvez rapidement accéder à toutes vos erreurs de test !

## 🆘 Si vous ne voyez toujours pas d'erreurs

1. **Vérifiez les logs du navigateur** (Console) pour des erreurs Sentry
2. **Vérifiez les requêtes réseau** dans DevTools
3. **Vérifiez que votre DSN est correct** dans `.env.local`
4. **Vérifiez que vous êtes connecté au bon projet** dans Sentry
5. **Attendez quelques minutes** - parfois il y a un délai de traitement
6. **Vérifiez les filtres inbound** dans Settings → Inbound Filters

## 📞 Support

Si le problème persiste :

- Vérifiez la documentation Sentry : https://docs.sentry.io
- Consultez `SENTRY_TROUBLESHOOTING.md` pour plus de détails
- Activez le mode debug et partagez les logs
