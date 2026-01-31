# 🔍 Guide de dépannage Sentry

Ce guide vous aide à résoudre les problèmes courants avec Sentry.

## ✅ Vérifications de base

### 1. Variables d'environnement requises

Assurez-vous que ces variables sont définies dans Railway (ou votre plateforme de déploiement) :

```env
# DSN Sentry (obligatoire)
NEXT_PUBLIC_SENTRY_DSN=https://votre-dsn@sentry.io/votre-project-id
SENTRY_DSN=https://votre-dsn@sentry.io/votre-project-id

# Environnement (optionnel, défaut: development)
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Release (optionnel)
SENTRY_RELEASE=1.0.0
NEXT_PUBLIC_SENTRY_RELEASE=1.0.0

# Pour activer Sentry en développement (optionnel)
SENTRY_ENABLE_DEV=true
NEXT_PUBLIC_SENTRY_ENABLE_DEV=true

# Pour activer le mode debug (optionnel, pour voir les logs)
SENTRY_DEBUG=true
NEXT_PUBLIC_SENTRY_DEBUG=true
```

### 2. Obtenir votre DSN Sentry

1. Connectez-vous à [sentry.io](https://sentry.io)
2. Allez dans **Settings** → **Projects** → Sélectionnez votre projet
3. Allez dans **Client Keys (DSN)**
4. Copiez votre DSN (format: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 3. Vérifier la configuration

#### En développement local

1. Créez un fichier `.env.local` à la racine de `apps/web/`
2. Ajoutez vos variables d'environnement
3. Redémarrez le serveur de développement

#### En production (Railway)

1. Allez dans votre projet Railway
2. Ouvrez l'onglet **Variables**
3. Ajoutez toutes les variables d'environnement nécessaires
4. Redéployez l'application

## 🐛 Problèmes courants

### Problème 1: Aucune erreur n'apparaît dans le dashboard

**Causes possibles :**

- `NEXT_PUBLIC_SENTRY_DSN` n'est pas défini
- Vous êtes en développement et `SENTRY_ENABLE_DEV` n'est pas défini à `true`
- Les erreurs sont filtrées par `beforeSend`

**Solutions :**

1. Vérifiez que `NEXT_PUBLIC_SENTRY_DSN` est défini dans Railway
2. Pour tester en développement, ajoutez `NEXT_PUBLIC_SENTRY_ENABLE_DEV=true`
3. Activez le mode debug : `NEXT_PUBLIC_SENTRY_DEBUG=true`
4. Testez avec la page `/sentry/test` pour envoyer une erreur de test

### Problème 2: Erreurs filtrées en développement

Par défaut, Sentry ne capture pas les erreurs en développement sauf si `SENTRY_ENABLE_DEV=true`.

**Solution :**
Ajoutez `NEXT_PUBLIC_SENTRY_ENABLE_DEV=true` dans vos variables d'environnement.

### Problème 3: Source maps manquants

Les source maps permettent de voir le code source original dans Sentry au lieu du code minifié.

**Solution :**

1. Assurez-vous que `SENTRY_ORG` et `SENTRY_PROJECT` sont définis dans Railway
2. Installez l'outil CLI Sentry : `npm install -g @sentry/cli`
3. Configurez l'authentification : `sentry-cli login`
4. Les source maps seront automatiquement uploadés lors du build

### Problème 4: Erreurs réseau bloquées

Certaines erreurs réseau sont automatiquement filtrées pour éviter le bruit.

**Solution :**
Si vous voulez capturer toutes les erreurs réseau, modifiez `instrumentation-client.ts` et commentez les filtres dans `beforeSend`.

## 🧪 Tester Sentry

### Méthode 1: Page de test intégrée

1. Naviguez vers `/sentry/test` (ou `/fr/sentry/test`)
2. Cliquez sur "Test Exception" ou "Test Message"
3. Vérifiez votre dashboard Sentry

### Méthode 2: Erreur manuelle

Dans la console du navigateur :

```javascript
// Test exception
throw new Error('Test Sentry error');

// Test message
import('@/lib/sentry/client').then(({ captureMessage }) => {
  captureMessage('Test message', 'info');
});
```

### Méthode 3: Vérifier les logs

Activez le mode debug pour voir ce qui se passe :

```env
NEXT_PUBLIC_SENTRY_DEBUG=true
SENTRY_DEBUG=true
```

Ensuite, regardez la console du navigateur et les logs serveur pour voir les messages de debug Sentry.

## 📊 Vérifier que Sentry fonctionne

### Dans le navigateur

1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet **Network**
3. Filtrez par "sentry"
4. Vous devriez voir des requêtes vers `*.sentry.io` quand une erreur se produit

### Dans les logs Railway

Cherchez les messages :

- `[Sentry] Initialized` (si debug est activé)
- `[Sentry] NEXT_PUBLIC_SENTRY_DSN is not set` (si DSN manquant)

## 🔧 Configuration avancée

### Modifier les filtres d'erreurs

Éditez `instrumentation-client.ts` ou `sentry.server.config.ts` pour modifier `beforeSend` :

```typescript
beforeSend(event, hint) {
  // Votre logique de filtrage personnalisée
  return event; // Retourner null pour ignorer l'erreur
}
```

### Ajouter du contexte utilisateur

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.setUser({
  id: '123',
  email: 'user@example.com',
  username: 'username',
});
```

## 📝 Checklist de dépannage

- [ ] `NEXT_PUBLIC_SENTRY_DSN` est défini dans Railway
- [ ] `SENTRY_DSN` est défini dans Railway (pour le serveur)
- [ ] `SENTRY_ENABLE_DEV=true` si vous testez en développement
- [ ] `SENTRY_DEBUG=true` pour voir les logs de debug
- [ ] L'application a été redéployée après avoir ajouté les variables
- [ ] Vous avez testé avec `/sentry/test`
- [ ] Vous avez vérifié les requêtes réseau vers Sentry dans DevTools
- [ ] Le DSN est correct (format: `https://xxx@xxx.ingest.sentry.io/xxx`)

## 🆘 Besoin d'aide ?

Si le problème persiste :

1. Vérifiez les logs Railway pour les erreurs
2. Activez le mode debug et regardez la console
3. Testez avec la page `/sentry/test`
4. Vérifiez que votre projet Sentry est actif et accessible
