#!/bin/bash
# Script de validation d'un batch avant commit
# Usage: ./scripts/validate-batch.sh

set -e

echo "🔍 Validation du batch avant commit..."
echo "========================================"

# Vérifier TypeScript
echo ""
echo "1️⃣  Vérification TypeScript..."
if pnpm type-check; then
    echo "✅ TypeScript: Aucune erreur"
else
    echo "❌ Erreurs TypeScript détectées!"
    exit 1
fi

# Vérifier le build
echo ""
echo "2️⃣  Vérification du build..."
if pnpm build; then
    echo "✅ Build: Réussi"
else
    echo "❌ Erreurs de build détectées!"
    exit 1
fi

# Vérifier les tests frontend
echo ""
echo "3️⃣  Vérification des tests frontend..."
if pnpm test; then
    echo "✅ Tests frontend: Tous passent"
else
    echo "❌ Certains tests frontend échouent!"
    exit 1
fi

# Vérifier les tests backend (si applicable)
if [ -d "backend" ]; then
    echo ""
    echo "4️⃣  Vérification des tests backend..."
    cd backend
    if python -m pytest --tb=short -q; then
        echo "✅ Tests backend: Tous passent"
        cd ..
    else
        echo "❌ Certains tests backend échouent!"
        cd ..
        exit 1
    fi
fi

echo ""
echo "✅ Toutes les validations sont passées!"
echo "Le batch est prêt pour le commit."
