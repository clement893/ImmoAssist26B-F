# Fix: Base de données vide - Exécuter les migrations

## Problème

Vous recevez l'erreur :
```json
{
  "success": false,
  "error": {
    "code": "HTTP_503",
    "message": "Database tables are missing. Please ensure database migrations have been run successfully."
  }
}
```

Cela signifie que les tables de la base de données n'ont pas été créées.

## Solution : Exécuter les migrations

### Option 1 : Via Railway CLI (Recommandé)

1. **Installer Railway CLI** (si pas déjà installé) :
   ```bash
   npm install -g @railway/cli
   ```

2. **Se connecter à Railway** :
   ```bash
   railway login
   ```

3. **Lier votre projet** (si nécessaire) :
   ```bash
   railway link
   ```

4. **Exécuter les migrations** :
   ```bash
   railway run alembic upgrade head
   ```

   Cette commande exécute toutes les migrations en attente sur votre base de données Railway.

### Option 2 : Via Railway Dashboard

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet
3. Ouvrez votre service backend
4. Allez dans l'onglet **"Deployments"** ou **"Logs"**
5. Cliquez sur **"Deploy"** ou **"Redeploy"** pour déclencher un nouveau déploiement
6. Les migrations devraient s'exécuter automatiquement via `entrypoint.sh`

### Option 3 : Via Railway Shell

1. Dans Railway Dashboard, ouvrez votre service backend
2. Cliquez sur **"Shell"** ou **"Open Shell"**
3. Exécutez :
   ```bash
   alembic upgrade head
   ```

### Option 4 : Vérifier et forcer les migrations

Si les migrations ne s'exécutent pas automatiquement :

1. **Vérifier l'état actuel** :
   ```bash
   railway run alembic current
   ```

2. **Voir l'historique** :
   ```bash
   railway run alembic history
   ```

3. **Forcer l'exécution** :
   ```bash
   railway run alembic upgrade head
   ```

## Vérification

Après avoir exécuté les migrations, vérifiez que les tables ont été créées :

### Via Railway CLI

```bash
railway run python -c "
from app.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
print('Tables créées:', tables)
"
```

### Via l'endpoint de santé

Appelez l'endpoint de santé de votre backend :
```
GET https://votre-backend.railway.app/api/v1/health
```

Vous devriez voir que les tables sont présentes.

## Liste des migrations disponibles

Votre projet contient les migrations suivantes (dans l'ordre) :

1. `001_initial_users.py` - Crée la table `users`
2. `001_add_rbac_teams_invitations.py` - Ajoute RBAC et équipes
3. `001_create_themes_table.py` - Crée la table `themes`
4. `002_add_oauth_fields.py` - Ajoute les champs OAuth aux users
5. `003_create_files_table.py` - Crée la table `files`
6. `007_add_database_indexes.py` - Ajoute les index
7. `008_add_subscriptions_tables.py` - Tables d'abonnements
8. `009_add_webhook_events_table.py` - Table d'événements webhook
9. `010_add_theme_preference.py` - Préférences de thème
10. `011_fix_file_model.py` - Corrections du modèle File
11. `012_add_integrations_table.py` - Table d'intégrations
12. `013_add_pages_forms_menus_support_tickets.py` - Pages, formulaires, menus, tickets
13. `014_add_tenancy_support.py` - Support multi-tenant
14. `015_rename_master_theme_to_template_theme.py` - Renommage
15. `016_remove_default_theme.py` - Suppression thème par défaut
16. `017_ensure_template_theme.py` - Assure le thème template
17. `018_create_theme_fonts_table.py` - Table des polices
18. `019_add_user_preferences_table.py` - Préférences utilisateur
19. `020_add_security_audit_logs_table.py` - Logs d'audit sécurité
20. `021_add_notifications_table.py` - Notifications
21. `022_add_user_permissions_table.py` - Permissions utilisateur
22. `023_merge_migration_heads.py` - Fusion des têtes de migration
23. `024_add_avatar_column_to_users.py` - Colonne avatar
24. `025_add_template_theme2_glassmorphism.py` - Thème glassmorphism
25. `026_add_luxury_theme.py` - Thème luxury
26. `027_add_hype_modern_theme.py` - Thème hype modern
27. `028_add_contacts_and_companies_tables.py` - Contacts et entreprises
28. `029_create_masterclass_tables.py` - Tables masterclass
29. `030_add_first_last_name_to_users.py` - Prénom et nom
30. `031_rename_password_hash_to_hashed_password.py` - Renommage colonne
31. `032_make_name_column_nullable.py` - Nom nullable

## Dépannage

### Les migrations échouent

Si les migrations échouent :

1. **Vérifier la connexion à la base de données** :
   ```bash
   railway run python -c "
   import os
   from app.database import engine
   print('DATABASE_URL:', os.getenv('DATABASE_URL')[:50] + '...')
   "
   ```

2. **Vérifier les logs** :
   ```bash
   railway logs
   ```

3. **Vérifier les permissions** :
   Assurez-vous que l'utilisateur de la base de données a les permissions nécessaires pour créer des tables.

### Migration déjà appliquée

Si une migration est déjà appliquée mais que les tables n'existent pas :

1. **Vérifier l'état** :
   ```bash
   railway run alembic current
   ```

2. **Marquer la base de données** (si nécessaire) :
   ```bash
   railway run alembic stamp head
   ```

3. **Réexécuter** :
   ```bash
   railway run alembic upgrade head
   ```

### Base de données complètement vide

Si la base de données est complètement vide :

1. **Réinitialiser** (⚠️ ATTENTION : supprime toutes les données) :
   ```bash
   railway run alembic downgrade base
   railway run alembic upgrade head
   ```

2. **Ou créer les tables manuellement** :
   ```bash
   railway run alembic upgrade head
   ```

## Prévention

Pour éviter ce problème à l'avenir :

1. ✅ Les migrations s'exécutent automatiquement via `entrypoint.sh` lors du déploiement
2. ✅ Vérifiez les logs Railway après chaque déploiement
3. ✅ Testez les migrations localement avant de déployer
4. ✅ Surveillez l'endpoint `/api/v1/health` pour vérifier l'état de la base de données

## Commandes utiles

```bash
# Voir l'état actuel
railway run alembic current

# Voir l'historique
railway run alembic history

# Exécuter les migrations
railway run alembic upgrade head

# Rétrograder d'une migration
railway run alembic downgrade -1

# Voir les logs
railway logs

# Ouvrir un shell
railway shell
```
