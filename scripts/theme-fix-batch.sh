#!/bin/bash
# Theme Fix Batch Helper Script
# Helps verify and commit batches

set -e

BATCH_NUMBER=$1
BATCH_NAME=$2

if [ -z "$BATCH_NUMBER" ] || [ -z "$BATCH_NAME" ]; then
  echo "Usage: ./scripts/theme-fix-batch.sh <batch-number> <batch-name>"
  echo "Example: ./scripts/theme-fix-batch.sh 1 \"Core Layout Components\""
  exit 1
fi

echo "🔍 Verifying Batch $BATCH_NUMBER: $BATCH_NAME"
echo ""

# TypeScript check
echo "📝 Running TypeScript check..."
cd apps/web
pnpm type-check
if [ $? -ne 0 ]; then
  echo "❌ TypeScript check failed!"
  exit 1
fi
echo "✅ TypeScript check passed"
echo ""

# Build check
echo "🔨 Running build check..."
pnpm build
if [ $? -ne 0 ]; then
  echo "❌ Build check failed!"
  exit 1
fi
echo "✅ Build check passed"
echo ""

cd ../..

# Git status
echo "📊 Git status:"
git status --short
echo ""

echo "✅ All checks passed! Ready to commit."
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Stage changes: git add ."
echo "3. Commit: git commit -m \"fix(theme): migrate batch $BATCH_NUMBER - $BATCH_NAME\""
echo "4. Push: git push"
echo "5. Update THEME_FIX_PROGRESS.md"

