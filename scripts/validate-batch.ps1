# Script de validation d'un batch avant commit (PowerShell)
# Usage: .\scripts\validate-batch.ps1

Write-Host "🔍 Validation du batch avant commit..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$ErrorCount = 0

# Vérifier TypeScript
Write-Host "`n1️⃣  Vérification TypeScript..." -ForegroundColor Yellow
try {
    pnpm type-check | Out-Null
    Write-Host "✅ TypeScript: Aucune erreur" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreurs TypeScript détectées!" -ForegroundColor Red
    $ErrorCount++
}

# Vérifier le build
Write-Host "`n2️⃣  Vérification du build..." -ForegroundColor Yellow
try {
    pnpm build | Out-Null
    Write-Host "✅ Build: Réussi" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreurs de build détectées!" -ForegroundColor Red
    $ErrorCount++
}

# Vérifier les tests frontend
Write-Host "`n3️⃣  Vérification des tests frontend..." -ForegroundColor Yellow
try {
    pnpm test | Out-Null
    Write-Host "✅ Tests frontend: Tous passent" -ForegroundColor Green
} catch {
    Write-Host "❌ Certains tests frontend échouent!" -ForegroundColor Red
    $ErrorCount++
}

# Vérifier les tests backend (si applicable)
if (Test-Path "backend") {
    Write-Host "`n4️⃣  Vérification des tests backend..." -ForegroundColor Yellow
    Push-Location backend
    try {
        python -m pytest --tb=short -q | Out-Null
        Write-Host "✅ Tests backend: Tous passent" -ForegroundColor Green
    } catch {
        Write-Host "❌ Certains tests backend échouent!" -ForegroundColor Red
        $ErrorCount++
    }
    Pop-Location
}

Write-Host ""

if ($ErrorCount -eq 0) {
    Write-Host "✅ Toutes les validations sont passées!" -ForegroundColor Green
    Write-Host "Le batch est prêt pour le commit." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ $ErrorCount erreur(s) détectée(s). Veuillez corriger avant de commiter." -ForegroundColor Red
    exit 1
}
