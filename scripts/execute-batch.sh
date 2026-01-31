#!/bin/bash
# Script d'exécution d'un batch de correction
# Usage: ./scripts/execute-batch.sh <batch-number> <batch-name>

set -e

BATCH_NUMBER=$1
BATCH_NAME=$2

if [ -z "$BATCH_NUMBER" ] || [ -z "$BATCH_NAME" ]; then
    echo "Usage: ./scripts/execute-batch.sh <batch-number> <batch-name>"
    echo "Example: ./scripts/execute-batch.sh 1 'console-log-cleanup'"
    exit 1
fi

BRANCH_NAME="fix/batch-${BATCH_NUMBER}-${BATCH_NAME}"
REPORT_FILE="PROGRESS_BATCH_${BATCH_NUMBER}.md"

echo "🚀 Démarrage du Batch ${BATCH_NUMBER}: ${BATCH_NAME}"
echo "=========================================="

# Créer la branche
echo "📝 Création de la branche: ${BRANCH_NAME}"
git checkout -b "${BRANCH_NAME}"

# Vérifier l'état initial
echo ""
echo "🔍 Vérification de l'état initial..."
echo "TypeScript:"
pnpm type-check || echo "⚠️  Erreurs TypeScript détectées (à corriger)"

echo ""
echo "Build:"
pnpm build || echo "⚠️  Erreurs de build détectées (à corriger)"

echo ""
echo "Tests:"
pnpm test || echo "⚠️  Certains tests échouent (à corriger)"

echo ""
echo "✅ État initial vérifié"
echo ""
echo "📋 Instructions:"
echo "1. Appliquer les modifications du batch ${BATCH_NUMBER}"
echo "2. Vérifier avec: pnpm type-check && pnpm build && pnpm test"
echo "3. Créer le rapport: ${REPORT_FILE}"
echo "4. Commit: git commit -m 'fix: batch ${BATCH_NUMBER} - ${BATCH_NAME}'"
echo "5. Push: git push origin ${BRANCH_NAME}"
echo ""
echo "Branche créée: ${BRANCH_NAME}"
echo "Rapport à créer: ${REPORT_FILE}"
