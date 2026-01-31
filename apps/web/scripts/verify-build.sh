#!/bin/bash
set -e

echo "🔍 Vérification TypeScript..."
cd apps/web
pnpm type-check

echo "✅ TypeScript OK"

echo "🔨 Vérification Build..."
pnpm build

echo "✅ Build OK"
echo "✅ Toutes les vérifications ont réussi!"

