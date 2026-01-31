# Troubleshooting: Google OAuth Database Connection Error

## Problème

Lors de la connexion avec Google OAuth, vous recevez l'erreur suivante :

```json
{
  "success": false,
  "error": {
    "code": "HTTP_503",
    "message": "Database connection failed. Please check your database configuration and ensure the database service is available. The Google OAuth authentication succeeded, but user data could not be saved."
  }
}
```

## Cause

Cette erreur se produit lorsque :
1. ✅ L'authentification Google réussit (l'utilisateur est authentifié par Google)
2. ❌ La sauvegarde des données utilisateur dans la base de données échoue

## Causes possibles

### 1. Base de données non accessible
- Le service de base de données est arrêté ou non disponible
- Problème de réseau entre le backend et la base de données
- La variable d'environnement `DATABASE_URL` est incorrecte ou manquante

### 2. Pool de connexions épuisé
- Trop de connexions simultanées à la base de données
- Les connexions ne sont pas correctement libérées
- Configuration du pool trop restrictive

### 3. Connexion expirée
- La connexion à la base de données a expiré pendant le processus OAuth
- Timeout de connexion trop court

### 4. Problème de configuration
- `DATABASE_URL` mal formatée
- Credentials incorrects
- SSL/TLS mal configuré

## Solutions

### 1. Vérifier la configuration de la base de données

Vérifiez que `DATABASE_URL` est correctement configurée :

```bash
# Vérifier la variable d'environnement
echo $DATABASE_URL

# Format attendu :
# postgresql+asyncpg://user:password@host:port/database
# ou
# postgresql://user:password@host:port/database (sera automatiquement converti)
```

### 2. Vérifier la connectivité à la base de données

Testez la connexion à la base de données :

```bash
# Utiliser le script de diagnostic
python backend/scripts/check_database_health.py

# Ou tester directement avec psql
psql $DATABASE_URL -c "SELECT 1;"
```

### 3. Vérifier les logs du backend

Les logs devraient maintenant contenir plus d'informations sur l'erreur :

```bash
# Chercher les erreurs de base de données dans les logs
grep -i "database error" backend/logs/*.log

# Chercher les tentatives de retry
grep -i "retrying oauth user creation" backend/logs/*.log
```

### 4. Vérifier la configuration du pool de connexions

Vérifiez les variables d'environnement suivantes :

```bash
# Taille du pool (défaut: 10)
DB_POOL_SIZE=10

# Connexions supplémentaires (défaut: 20)
DB_MAX_OVERFLOW=20

# Timeout du pool (défaut: 30 secondes)
DB_POOL_TIMEOUT=30
```

### 5. Améliorations apportées

Le code a été amélioré pour :
- ✅ Ajouter un mécanisme de retry automatique (3 tentatives)
- ✅ Utiliser un backoff exponentiel entre les tentatives
- ✅ Améliorer les logs pour faciliter le diagnostic
- ✅ Gérer les erreurs de connexion de manière plus robuste

## Diagnostic détaillé

### Vérifier l'état de la base de données

```python
# Script Python pour tester la connexion
from app.core.database import engine
from sqlalchemy import text

async def test_connection():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT 1"))
        print("✅ Connexion réussie")
        print(result.fetchone())
```

### Vérifier le pool de connexions

```python
# Vérifier l'état du pool
from app.core.database import engine

print(f"Pool size: {engine.pool.size()}")
print(f"Pool checked out: {engine.pool.checkedout()}")
print(f"Pool overflow: {engine.pool.overflow()}")
```

## Solutions spécifiques par environnement

### Railway

1. Vérifiez que le service PostgreSQL est démarré
2. Vérifiez que `DATABASE_URL` est correctement configurée dans les variables d'environnement
3. Vérifiez les logs Railway pour les erreurs de connexion

### Local (Docker)

1. Vérifiez que le conteneur PostgreSQL est en cours d'exécution :
   ```bash
   docker ps | grep postgres
   ```

2. Vérifiez la connectivité réseau :
   ```bash
   docker exec -it <backend-container> ping <postgres-container>
   ```

### Production

1. Vérifiez les règles de pare-feu
2. Vérifiez les certificats SSL/TLS si nécessaire
3. Vérifiez les limites de connexions de la base de données

## Prévention

Pour éviter ce problème à l'avenir :

1. ✅ Le code inclut maintenant un mécanisme de retry automatique
2. ✅ Les logs sont améliorés pour faciliter le diagnostic
3. ✅ La gestion d'erreur est plus robuste

## Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez les logs détaillés du backend
2. Vérifiez les logs de la base de données
3. Vérifiez la configuration réseau
4. Contactez le support avec les informations de diagnostic
