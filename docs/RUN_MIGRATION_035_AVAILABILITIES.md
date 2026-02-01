# Exécuter la migration 035 - User Availabilities

La nouvelle migration `035_create_user_availabilities_table.py` doit être appliquée pour créer la table `user_availabilities` nécessaire à la gestion des disponibilités du calendrier.

## Option 1 : Via Railway Dashboard (Recommandé - Le plus simple)

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet
3. Cliquez sur le service **backend**
4. Allez dans l'onglet **"Deployments"** ou **"Metrics"**
5. Cliquez sur **"View Logs"** ou ouvrez le **"Shell"** (terminal)
6. Dans le shell, exécutez :
   ```bash
   alembic upgrade head
   ```

## Option 2 : Via Railway CLI

1. Installez Railway CLI si ce n'est pas déjà fait :
   ```bash
   npm install -g @railway/cli
   ```

2. Connectez-vous :
   ```bash
   railway login
   ```

3. Liez votre projet :
   ```bash
   railway link
   ```

4. Exécutez la migration :
   ```bash
   railway run alembic upgrade head
   ```

## Option 3 : Via Railway Shell (Dashboard)

1. Allez sur [Railway Dashboard](https://railway.app)
2. Sélectionnez votre projet → service **backend**
3. Cliquez sur **"Shell"** ou **"Open Shell"**
4. Exécutez :
   ```bash
   alembic upgrade head
   ```

## Vérification

Après avoir exécuté la migration, vérifiez que tout fonctionne :

1. Vérifiez les logs du backend pour confirmer que la migration a été appliquée
2. Testez l'endpoint `/api/v1/calendar/availability/me` pour voir si la table existe
3. Accédez à la page `/fr/dashboard/modules/calendrier/disponibilites`

## En cas d'erreur

Si vous rencontrez des erreurs lors de l'exécution de la migration :

1. Vérifiez les logs du backend sur Railway
2. Assurez-vous que la connexion à la base de données est correcte
3. Vérifiez que vous êtes dans le bon répertoire (`backend/`)
4. Si nécessaire, exécutez `alembic current` pour voir la version actuelle

## Note importante

Cette migration crée :
- La table `user_availabilities`
- L'enum PostgreSQL `dayofweek`
- Les index nécessaires pour les performances

Une fois la migration appliquée, l'erreur "Database schema is not up to date" devrait disparaître et la fonctionnalité de gestion des disponibilités sera opérationnelle.
