#!/bin/bash

# Script de migration de base de données automatisé (version bash)
# Usage: 
#   ./scripts/migrate-db.sh create MigrationName
#   ./scripts/migrate-db.sh upgrade [revision]
#   ./scripts/migrate-db.sh downgrade [revision]
#   ./scripts/migrate-db.sh current
#   ./scripts/migrate-db.sh history

set -e

COMMAND=$1
MIGRATION_NAME=$2

cd "$(dirname "$0")/../backend" || exit 1

case "$COMMAND" in
  create)
    if [ -z "$MIGRATION_NAME" ]; then
      echo "❌ Erreur: Nom de migration requis"
      echo "Usage: ./scripts/migrate-db.sh create MigrationName"
      exit 1
    fi
    echo "📝 Création de la migration: $MIGRATION_NAME"
    alembic revision --autogenerate -m "$MIGRATION_NAME"
    echo "✅ Migration créée avec succès!"
    ;;

  upgrade)
    REVISION=${MIGRATION_NAME:-head}
    echo "⬆️  Application de la migration vers: $REVISION"
    alembic upgrade "$REVISION"
    echo "✅ Migration appliquée avec succès!"
    ;;

  downgrade)
    TARGET_REVISION=${MIGRATION_NAME:--1}
    echo "⬇️  Rétrogradation de la migration vers: $TARGET_REVISION"
    alembic downgrade "$TARGET_REVISION"
    echo "✅ Migration rétrogradée avec succès!"
    ;;

  current)
    echo "📊 Révision actuelle:"
    alembic current
    ;;

  history)
    echo "📜 Historique des migrations:"
    alembic history
    ;;

  stamp)
    if [ -z "$MIGRATION_NAME" ]; then
      echo "❌ Erreur: Révision requise"
      echo "Usage: ./scripts/migrate-db.sh stamp revision"
      exit 1
    fi
    echo "🏷️  Marquage de la base de données à la révision: $MIGRATION_NAME"
    alembic stamp "$MIGRATION_NAME"
    echo "✅ Base de données marquée avec succès!"
    ;;

  *)
    echo "❌ Commande inconnue: $COMMAND"
    echo ""
    echo "Commandes disponibles:"
    echo "  create <name>     - Créer une nouvelle migration"
    echo "  upgrade [rev]     - Appliquer les migrations (vers head par défaut)"
    echo "  downgrade [rev]   - Rétrograder les migrations (1 révision par défaut)"
    echo "  current           - Afficher la révision actuelle"
    echo "  history           - Afficher l'historique des migrations"
    echo "  stamp <rev>       - Marquer la base de données à une révision"
    exit 1
    ;;
esac

