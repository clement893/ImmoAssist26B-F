# 🚂 Guide Railway CLI - Configuration et Utilisation

## ✅ Installation Complétée

Railway CLI est maintenant installé sur votre système (version 4.16.1).

## 🔐 Étape 1 : Se Connecter à Railway

Ouvrez un terminal PowerShell ou CMD et exécutez :

```bash
railway login
```

Cette commande va :

1. Ouvrir votre navigateur par défaut
2. Vous rediriger vers Railway pour vous connecter
3. Vous demander d'autoriser Railway CLI à accéder à votre compte

**Note** : Si le navigateur ne s'ouvre pas automatiquement, vous verrez une URL à copier-coller dans votre navigateur.

## 🔗 Étape 2 : Lier votre Projet

Une fois connecté, liez Railway CLI à votre projet :

```bash
# Naviguer vers le répertoire du projet
cd C:\Users\cleme\MODELE-NEXTJS-FULLSTACK

# Lier au projet Railway
railway link
```

Cette commande va vous demander de sélectionner :

1. Votre projet Railway (si vous en avez plusieurs)
2. L'environnement (production, staging, etc.)

## 🔍 Étape 3 : Diagnostiquer le Problème RBAC

Une fois lié, exécutez le script de diagnostic :

```bash
# Remplacez VOTRE_EMAIL@example.com par votre email réel
railway run python backend/scripts/diagnose_rbac.py --user-email VOTRE_EMAIL@example.com
```

Cette commande va :

- Se connecter à votre base de données Railway
- Vérifier l'état des rôles et permissions
- Vérifier votre compte utilisateur
- Afficher des recommandations

## 🛠️ Étape 4 : Corriger le Problème RBAC

Si le diagnostic montre que des corrections sont nécessaires :

```bash
# Remplacez VOTRE_EMAIL@example.com par votre email réel
railway run python backend/scripts/fix_rbac_user.py --user-email VOTRE_EMAIL@example.com --seed-data --assign-superadmin
```

Cette commande va :

- Créer les permissions par défaut si elles n'existent pas
- Créer les rôles par défaut si ils n'existent pas
- Assigner le rôle `superadmin` à votre compte

## 📋 Commandes Railway CLI Utiles

### Voir les Variables d'Environnement

```bash
railway variables
```

### Voir les Logs

```bash
railway logs
```

### Ouvrir un Shell Interactif

```bash
railway shell
```

### Voir l'État du Déploiement

```bash
railway status
```

### Déployer des Changements

```bash
railway up
```

## 🎯 Exécution des Scripts RBAC

### Diagnostic Complet

```bash
railway run python backend/scripts/diagnose_rbac.py --user-email votre@email.com
```

### Correction Complète (Seeding + Superadmin)

```bash
railway run python backend/scripts/fix_rbac_user.py --user-email votre@email.com --seed-data --assign-superadmin
```

### Seulement Assigner Superadmin (si les données sont déjà présentes)

```bash
railway run python backend/scripts/fix_rbac_user.py --user-email votre@email.com --assign-superadmin
```

### Seulement Seeder les Données (sans assigner de rôle)

```bash
railway run python backend/scripts/fix_rbac_user.py --user-email votre@email.com --seed-data
```

## ⚠️ Notes Importantes

1. **Email** : Remplacez toujours `votre@email.com` par votre email réel utilisé pour vous connecter à l'application

2. **Reconnexion** : Après avoir assigné le rôle superadmin, vous devez vous **reconnecter** dans l'application frontend pour obtenir un nouveau token JWT

3. **Sécurité** : Les scripts sont idempotents - vous pouvez les exécuter plusieurs fois sans créer de doublons

4. **Logs** : Si vous rencontrez des erreurs, vérifiez les logs avec `railway logs`

## 🆘 Dépannage

### Erreur : "Cannot login in non-interactive mode"

- Exécutez `railway login` dans un terminal interactif (pas via un script)

### Erreur : "Project not linked"

- Exécutez `railway link` dans le répertoire du projet

### Erreur : "Module not found"

- Les dépendances Python sont installées automatiquement dans l'environnement Railway
- Si le problème persiste, vérifiez que vous êtes dans le bon répertoire

### Erreur : "User not found"

- Vérifiez que l'email est correct
- Assurez-vous que l'utilisateur existe dans la base de données

## 📝 Prochaines Étapes

1. ✅ Railway CLI installé
2. ⏭️ Se connecter : `railway login`
3. ⏭️ Lier le projet : `railway link`
4. ⏭️ Exécuter le diagnostic : `railway run python backend/scripts/diagnose_rbac.py --user-email VOTRE_EMAIL`
5. ⏭️ Exécuter la correction : `railway run python backend/scripts/fix_rbac_user.py --user-email VOTRE_EMAIL --seed-data --assign-superadmin`
6. ⏭️ Se reconnecter dans l'application frontend

## 🎉 Résultat Attendu

Après avoir exécuté la correction avec succès, vous devriez voir :

```
✅ Created 16 new permissions
✅ Created 2 new roles
✅ Successfully assigned superadmin role to votre@email.com
```

Et dans l'application :

- ✅ Les endpoints RBAC retournent `200 OK` au lieu de `403 Forbidden`
- ✅ L'interface affiche les rôles et permissions disponibles
- ✅ Vous pouvez gérer les rôles et permissions des utilisateurs
