#!/bin/bash

# Script de déploiement Railway
# Usage: ./scripts/deploy-railway.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_DIR="apps/web"

echo "🚀 Déploiement sur Railway - Environnement: $ENVIRONMENT"

# Vérifier que Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé. Installation..."
    npm install -g @railway/cli
fi

# Vérifier que l'utilisateur est connecté
if ! railway whoami &> /dev/null; then
    echo "🔐 Connexion à Railway..."
    railway login
fi

# Aller dans le répertoire du projet
cd "$PROJECT_DIR" || exit

# Déployer
echo "📦 Déploiement en cours..."
railway up

echo "✅ Déploiement terminé!"

