# Conditions nécessaires pour l'exécution des migrations Alembic

## ✅ Conditions automatiques (déjà en place)

La migration **024_add_avatar_column** sera exécutée automatiquement si les conditions suivantes sont remplies :

### 1. Variable d'environnement `DATABASE_URL` ✅

- **Nécessaire** : La variable `DATABASE_URL` doit être définie
- **Vérification** : Le script `entrypoint.sh` vérifie avec `if [ -n "$DATABASE_URL" ]`
- **Sur Railway** : Cette variable est généralement définie automatiquement

### 2. Script `entrypoint.sh` exécuté ✅

- **Nécessaire** : Le script doit être exécuté au démarrage du conteneur
- **Vérification** : Le Dockerfile doit utiliser `entrypoint.sh` comme point d'entrée
- **Commande** : `alembic upgrade head` est exécutée automatiquement

### 3. Connexion à la base de données ✅

- **Nécessaire** : Alembic doit pouvoir se connecter à PostgreSQL
- **Vérification** : Le script essaie de se connecter et affiche les erreurs si échec
- **Timeout** : 60 secondes maximum pour éviter de bloquer le démarrage

### 4. Chaîne de migrations correcte ✅

- **Nécessaire** : La migration 024 doit pointer vers la bonne migration précédente
- **État actuel** : `024_add_avatar_column` → `022_add_user_permissions` ✅
- **Vérification** : `alembic heads` doit montrer une seule head

### 5. Aucun conflit de migrations ✅

- **Nécessaire** : Pas de multiple heads ou de conflits
- **Gestion automatique** : Le script détecte et tente de merger automatiquement

## 🔍 Comment vérifier si la migration a été exécutée

### Vérifier dans les logs Railway

Lors du démarrage du backend, vous devriez voir :

```
==========================================
Running database migrations...
==========================================
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade 022_add_user_permissions -> 024_add_avatar_column, add avatar column to users table
✅ Database migrations completed successfully
```

### Vérifier dans la base de données

Connectez-vous à votre base de données PostgreSQL et exécutez :

```sql
-- Vérifier si la colonne existe
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'avatar';

-- Vérifier l'historique des migrations Alembic
SELECT * FROM alembic_version;
```

### Vérifier manuellement avec Alembic

Si vous avez accès au conteneur :

```bash
# Voir l'état actuel
alembic current

# Voir l'historique
alembic history

# Voir les heads (doit montrer 024_add_avatar_column)
alembic heads
```

## ⚠️ Pourquoi la migration pourrait ne pas s'exécuter

### 1. Variable `DATABASE_URL` manquante

- **Symptôme** : Logs montrent "⚠️ Warning: DATABASE_URL not set, skipping migrations..."
- **Solution** : Vérifier que `DATABASE_URL` est définie dans Railway

### 2. Connexion à la base de données échoue

- **Symptôme** : Logs montrent des erreurs de connexion
- **Solution** : Vérifier les credentials de la base de données

### 3. Migration timeout (> 60 secondes)

- **Symptôme** : Logs montrent "⚠️ Database migrations failed, timed out, or skipped!"
- **Solution** : La migration sera réessayée au prochain redémarrage

### 4. Conflit de migrations (multiple heads)

- **Symptôme** : Logs montrent "⚠️ Multiple migration heads detected"
- **Solution** : Le script tente automatiquement de merger, mais peut nécessiter une intervention manuelle

### 5. Migration déjà appliquée

- **Symptôme** : La colonne `avatar` existe déjà
- **Solution** : C'est normal, la migration sera ignorée

## 🚀 Solution de secours : Auto-migration

**Bonne nouvelle** : Même si la migration Alembic ne s'exécute pas, la fonction `ensure_avatar_column()` dans `app/core/migrations.py` créera automatiquement la colonne au démarrage de l'application.

Cette fonction :

- ✅ Vérifie si la colonne existe
- ✅ La crée si elle n'existe pas
- ✅ Ne fait rien si elle existe déjà
- ✅ Ne bloque pas le démarrage en cas d'erreur

## 📝 Résumé

**Pour que la migration soit exécutée automatiquement :**

1. ✅ `DATABASE_URL` doit être définie (généralement automatique sur Railway)
2. ✅ Le conteneur doit démarrer (exécute `entrypoint.sh`)
3. ✅ La connexion à la base de données doit fonctionner
4. ✅ La chaîne de migrations doit être correcte (✅ corrigée)

**Si la migration ne s'exécute pas :**

- La fonction `ensure_avatar_column()` créera la colonne automatiquement
- Vous pouvez vérifier les logs Railway pour voir ce qui s'est passé
- Vous pouvez exécuter manuellement : `alembic upgrade head`
