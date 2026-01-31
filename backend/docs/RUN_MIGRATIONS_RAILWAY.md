# Guide : Exécuter les migrations Alembic sur Railway

## Problème

Vous recevez l'erreur :
```
Database schema is not up to date. Please run database migrations (alembic upgrade head)
```

Cela signifie que les migrations Alembic n'ont pas été exécutées sur la base de données de production.

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

3. **Naviguer vers le répertoire backend** :
   ```bash
   cd backend
   ```

4. **Lier votre projet** (si nécessaire) :
   ```bash
   railway link
   ```
   Sélectionnez votre projet et le service backend.

5. **Exécuter les migrations** :
   ```bash
   railway run alembic upgrade head
   ```

   Cette commande exécute toutes les migrations en attente sur votre base de données Railway.

### Option 2 : Via Railway Dashboard (Shell)

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet
3. Ouvrez votre service **backend**
4. Cliquez sur l'onglet **"Deployments"**
5. Cliquez sur le dernier déploiement pour voir les détails
6. Cliquez sur **"Shell"** ou **"Open Shell"** (icône terminal)
7. Exécutez :
   ```bash
   cd backend
   alembic upgrade head
   ```

### Option 3 : Redéployer le backend (Exécution automatique)

Les migrations devraient s'exécuter automatiquement au démarrage via `entrypoint.sh`. Si elles ne s'exécutent pas :

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet
3. Ouvrez votre service **backend**
4. Cliquez sur **"Deploy"** ou **"Redeploy"**
5. Vérifiez les logs pour voir si les migrations s'exécutent :
   ```
   ==========================================
   Running database migrations...
   ==========================================
   ```

### Option 4 : Vérifier l'état des migrations

Pour vérifier l'état actuel des migrations :

```bash
# Via Railway CLI
cd backend
railway run alembic current
railway run alembic history
```

## Vérification

Après avoir exécuté les migrations, vérifiez que les colonnes ont été ajoutées :

### Migrations attendues

1. **`66a1b2c3d4e5_add_oaciq_fields_to_forms`** - Ajoute les champs OACIQ aux formulaires
   - Colonnes ajoutées à `forms` : `code`, `category`, `pdf_url`, `transaction_id`
   - Colonnes ajoutées à `form_submissions` : `status`, `transaction_id`
   - Table créée : `form_submission_versions`

2. **`7a8b9c0d1e2f_add_documents_field_to_transactions`** - Ajoute la colonne `documents` aux transactions
   - Colonne ajoutée à `real_estate_transactions` : `documents` (JSON)

### Vérifier via Railway CLI

```bash
cd backend
railway run python -c "
from app.core.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
print('Colonnes dans forms:', [c['name'] for c in inspector.get_columns('forms')])
print('Colonnes dans form_submissions:', [c['name'] for c in inspector.get_columns('form_submissions')])
print('Tables:', inspector.get_table_names())
"
```

## Dépannage

### Les migrations ne s'exécutent pas automatiquement

1. Vérifiez que `DATABASE_URL` est définie dans les variables d'environnement Railway
2. Vérifiez les logs du backend pour voir les erreurs de migration
3. Exécutez manuellement avec `railway run alembic upgrade head`

### Erreur "Multiple heads detected"

Si vous voyez cette erreur, il y a un conflit de migrations. Exécutez :

```bash
cd backend
railway run alembic heads
railway run alembic merge -m "Merge migration heads" <head1> <head2>
railway run alembic upgrade head
```

### Erreur de connexion à la base de données

Vérifiez que :
1. La variable `DATABASE_URL` est correctement définie dans Railway
2. La base de données PostgreSQL est accessible
3. Les credentials sont corrects

## Commandes utiles

```bash
# Voir l'état actuel
railway run alembic current

# Voir l'historique
railway run alembic history

# Voir les heads (révisions en tête)
railway run alembic heads

# Exécuter les migrations
railway run alembic upgrade head

# Créer une nouvelle migration (développement uniquement)
railway run alembic revision --autogenerate -m "description"
```
