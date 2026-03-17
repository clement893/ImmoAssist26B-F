# 🔧 Fix: Database Schema Not Up To Date - Railway

## 🚨 Erreur

```
Database schema is not up to date. Please run database migrations (alembic upgrade head).
```

Cette erreur indique que les migrations Alembic n'ont pas été exécutées sur la base de données Railway en production.

---

## ✅ Solution Rapide

### Option 1: Via Railway CLI (Recommandé)

1. **Installer Railway CLI** (si pas déjà installé):
   ```powershell
   npm install -g @railway/cli
   ```

2. **Se connecter à Railway**:
   ```powershell
   railway login
   ```

3. **Lier le projet**:
   ```powershell
   railway link
   ```
   Sélectionnez votre projet Railway.

4. **Exécuter les migrations**:
   ```powershell
   cd backend
   railway run alembic upgrade head
   ```

### Option 2: Via Script PowerShell

Utilisez le script existant :

```powershell
.\scripts\run-migrations-railway.ps1
```

Ce script va :
- Vérifier Railway CLI
- Se connecter automatiquement
- Vérifier l'état actuel
- Exécuter les migrations avec confirmation

### Option 3: Via Railway Dashboard

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet
3. Ouvrez votre service **backend**
4. Allez dans l'onglet **"Deployments"**
5. Cliquez sur **"Redeploy"** pour déclencher un nouveau déploiement
6. Les migrations devraient s'exécuter automatiquement via `entrypoint.sh`

### Option 4: Via Railway Shell

1. Dans Railway Dashboard, ouvrez votre service backend
2. Cliquez sur **"Shell"** ou **"Open Shell"**
3. Exécutez :
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## 🔍 Vérification

Après avoir exécuté les migrations, vérifiez l'état :

```powershell
cd backend
railway run alembic current
```

Vous devriez voir la dernière révision appliquée.

---

## 📋 Commandes Utiles

### Vérifier l'état actuel
```powershell
railway run alembic current
```

### Voir l'historique des migrations
```powershell
railway run alembic history
```

### Voir les migrations en attente
```powershell
railway run alembic heads
```

### Exécuter les migrations
```powershell
railway run alembic upgrade head
```

### Rollback (si nécessaire)
```powershell
railway run alembic downgrade -1
```

---

## ⚠️ Problèmes Courants

### Railway CLI non installé
```powershell
npm install -g @railway/cli
```

### Projet non lié
```powershell
railway link
```

### Migrations multiples heads
Si vous voyez plusieurs "heads", il faut créer une migration de merge :
```powershell
railway run alembic merge -m "Merge heads" <head1> <head2>
railway run alembic upgrade head
```

### Timeout des migrations
Si les migrations prennent trop de temps, elles peuvent timeout. Dans ce cas :
1. Vérifiez les logs Railway
2. Exécutez les migrations manuellement via Shell
3. Vérifiez la connexion à la base de données

---

## 🎯 Après les Migrations

Une fois les migrations exécutées :
1. ✅ L'erreur devrait disparaître
2. ✅ L'API `/api/v1/transactions/` devrait fonctionner
3. ✅ Les tables manquantes seront créées

---

## 📞 Support

Si les migrations échouent toujours :
1. Vérifiez les logs Railway : `railway logs`
2. Vérifiez la connexion à la base de données
3. Vérifiez que `DATABASE_URL` est bien défini dans Railway
