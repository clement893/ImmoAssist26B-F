# Fix: Migration Error - Duplicate ENUM Type

## Problème

Lors de l'exécution des migrations, vous recevez l'erreur :

```
psycopg2.errors.DuplicateObject: type "planinterval" already exists
```

Cela se produit parce que le type ENUM existe déjà dans la base de données d'une tentative précédente de migration qui a partiellement réussi.

## Solution

### Option 1 : Supprimer le type ENUM existant (Recommandé)

1. **Connectez-vous à votre base de données Railway** :
   ```bash
   railway run psql $DATABASE_URL
   ```

2. **Vérifiez si le type existe** :
   ```sql
   SELECT typname FROM pg_type WHERE typname = 'planinterval';
   ```

3. **Supprimez le type s'il existe** :
   ```sql
   DROP TYPE IF EXISTS planinterval CASCADE;
   DROP TYPE IF EXISTS planstatus CASCADE;
   DROP TYPE IF EXISTS subscriptionstatus CASCADE;
   DROP TYPE IF EXISTS invoicestatus CASCADE;
   ```

4. **Quittez psql** :
   ```sql
   \q
   ```

5. **Réexécutez les migrations** :
   ```bash
   railway run alembic upgrade head
   ```

### Option 2 : Utiliser la migration corrigée

La migration `008_add_subscriptions_tables.py` a été corrigée pour vérifier si les types ENUM existent avant de les créer. 

1. **Assurez-vous d'avoir la dernière version du code** :
   ```bash
   git pull
   ```

2. **Réexécutez les migrations** :
   ```bash
   railway run alembic upgrade head
   ```

### Option 3 : Marquer la migration comme appliquée (si les tables existent déjà)

Si les tables `plans`, `subscriptions`, et `invoices` existent déjà mais que la migration échoue :

1. **Vérifiez l'état actuel** :
   ```bash
   railway run alembic current
   ```

2. **Marquez la migration comme appliquée** :
   ```bash
   railway run alembic stamp 008_add_subscriptions
   ```

3. **Continuez avec les migrations suivantes** :
   ```bash
   railway run alembic upgrade head
   ```

## Vérification

Après avoir résolu le problème, vérifiez que les migrations se sont bien exécutées :

```bash
# Vérifier l'état actuel
railway run alembic current

# Vérifier que les tables existent
railway run python -c "
from app.database import engine
from sqlalchemy import inspect
inspector = inspect(engine)
tables = inspector.get_table_names()
required_tables = ['users', 'themes', 'plans', 'subscriptions', 'invoices']
missing = [t for t in required_tables if t not in tables]
if missing:
    print('Tables manquantes:', missing)
else:
    print('Toutes les tables requises existent!')
"
```

## Cause du problème

Ce problème se produit généralement lorsque :
1. Une migration précédente a partiellement réussi (créé les types ENUM mais pas les tables)
2. La migration a été interrompue avant de créer les tables
3. Une tentative de rollback a laissé les types ENUM en place

## Prévention

Pour éviter ce problème à l'avenir :
1. ✅ La migration corrigée vérifie maintenant explicitement si les types existent
2. ✅ Utilisez toujours des transactions pour les migrations
3. ✅ Vérifiez les logs après chaque déploiement
4. ✅ Testez les migrations localement avant de déployer
