# Script de vérification pré-déploiement (PowerShell)
# Ce script vérifie que tous les tests passent avant le déploiement

$ErrorActionPreference = "Stop"

Write-Host "🔍 Vérification pré-déploiement..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon répertoire
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Ce script doit être exécuté depuis la racine du projet" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Vérification des dépendances..." -ForegroundColor Cyan

# Vérifier les dépendances Node.js
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules non trouvé, installation des dépendances..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🧪 Exécution des tests backend..." -ForegroundColor Cyan
Set-Location backend

# Vérifier que pytest est disponible
try {
    $pytestVersion = python -m pytest --version 2>&1
} catch {
    Write-Host "❌ pytest n'est pas disponible. Exécutez: pip install -r requirements.txt" -ForegroundColor Red
    exit 1
}

# Exécuter les tests backend avec couverture
$env:DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/modele_test_db"
$env:REDIS_URL = "redis://localhost:6379/0"
$env:SECRET_KEY = "test-secret-key"
$env:FRONTEND_URL = "http://localhost:3000"
$env:ENVIRONMENT = "test"

try {
    python -m pytest --cov=app --cov-report=term --cov-fail-under=70
    if ($LASTEXITCODE -ne 0) {
        throw "Tests backend échoués"
    }
    Write-Host "✅ Tests backend réussis" -ForegroundColor Green
} catch {
    Write-Host "❌ Les tests backend ont échoué ou la couverture est insuffisante" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Exécution des tests frontend..." -ForegroundColor Cyan
Set-Location ../apps/web

# Vérifier que les dépendances sont installées
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠️  node_modules non trouvé dans apps/web, installation..." -ForegroundColor Yellow
    npm install
}

# Exécuter les tests frontend
try {
    npm run test
    if ($LASTEXITCODE -ne 0) {
        throw "Tests frontend échoués"
    }
    Write-Host "✅ Tests frontend réussis" -ForegroundColor Green
} catch {
    Write-Host "❌ Les tests frontend ont échoué" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Vérification du linting..." -ForegroundColor Cyan
Set-Location ../..

try {
    npm run lint
    if ($LASTEXITCODE -ne 0) {
        throw "Linting échoué"
    }
    Write-Host "✅ Linting réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Le linting a échoué" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔍 Vérification du type checking..." -ForegroundColor Cyan
try {
    npm run type-check
    if ($LASTEXITCODE -ne 0) {
        throw "Type checking échoué"
    }
    Write-Host "✅ Type checking réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Le type checking a échoué" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🏗️  Vérification du build..." -ForegroundColor Cyan
Set-Location apps/web
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build échoué"
    }
    Write-Host "✅ Build réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Le build a échoué" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Toutes les vérifications sont passées ! Le déploiement peut continuer." -ForegroundColor Green

