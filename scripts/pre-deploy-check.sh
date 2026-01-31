#!/bin/bash
# Script de vérification pré-déploiement
# Ce script vérifie que tous les tests passent avant le déploiement

set -e  # Arrêter en cas d'erreur

echo "🔍 Vérification pré-déploiement..."
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Fonction pour afficher les succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Ce script doit être exécuté depuis la racine du projet"
fi

echo "📦 Vérification des dépendances..."

# Vérifier les dépendances Node.js
if [ ! -d "node_modules" ]; then
    warning "node_modules non trouvé, installation des dépendances..."
    npm install
fi

# Vérifier les dépendances Python
if [ ! -d "backend/.venv" ] && [ ! -f "backend/requirements.txt" ]; then
    warning "Dépendances Python non trouvées"
fi

echo ""
echo "🧪 Exécution des tests backend..."
cd backend

# Vérifier que pytest est installé
if ! command -v pytest &> /dev/null; then
    error "pytest n'est pas installé. Exécutez: pip install -r requirements.txt"
fi

# Exécuter les tests backend avec couverture
if ! pytest --cov=app --cov-report=term --cov-fail-under=70; then
    error "Les tests backend ont échoué ou la couverture est insuffisante"
fi

success "Tests backend réussis"

echo ""
echo "🧪 Exécution des tests frontend..."
cd ../apps/web

# Vérifier que les dépendances sont installées
if [ ! -d "node_modules" ]; then
    warning "node_modules non trouvé dans apps/web, installation..."
    npm install
fi

# Exécuter les tests frontend
if ! npm run test; then
    error "Les tests frontend ont échoué"
fi

success "Tests frontend réussis"

echo ""
echo "🔍 Vérification du linting..."
cd ../..

# Lint frontend
if ! npm run lint; then
    error "Le linting frontend a échoué"
fi

success "Linting réussi"

echo ""
echo "🔍 Vérification du type checking..."
if ! npm run type-check; then
    error "Le type checking a échoué"
fi

success "Type checking réussi"

echo ""
echo "🏗️  Vérification du build..."
cd apps/web
if ! npm run build; then
    error "Le build a échoué"
fi

success "Build réussi"

echo ""
echo -e "${GREEN}✨ Toutes les vérifications sont passées ! Le déploiement peut continuer.${NC}"

