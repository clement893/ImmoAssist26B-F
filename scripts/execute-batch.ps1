# Script d'exécution d'un batch de correction (PowerShell)
# Usage: .\scripts\execute-batch.ps1 <batch-number> <batch-name>

param(
    [Parameter(Mandatory=$true)]
    [int]$BatchNumber,
    
    [Parameter(Mandatory=$true)]
    [string]$BatchName
)

$BranchName = "fix/batch-${BatchNumber}-${BatchName}"
$ReportFile = "PROGRESS_BATCH_${BatchNumber}.md"

Write-Host "🚀 Démarrage du Batch ${BatchNumber}: ${BatchName}" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Créer la branche
Write-Host "`n📝 Création de la branche: ${BranchName}" -ForegroundColor Yellow
git checkout -b $BranchName

# Vérifier l'état initial
Write-Host "`n🔍 Vérification de l'état initial..." -ForegroundColor Yellow
Write-Host "TypeScript:" -ForegroundColor Gray
try {
    pnpm type-check
    Write-Host "✅ TypeScript: OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreurs TypeScript détectées (à corriger)" -ForegroundColor Red
}

Write-Host "`nBuild:" -ForegroundColor Gray
try {
    pnpm build
    Write-Host "✅ Build: OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Erreurs de build détectées (à corriger)" -ForegroundColor Red
}

Write-Host "`nTests:" -ForegroundColor Gray
try {
    pnpm test
    Write-Host "✅ Tests: OK" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Certains tests échouent (à corriger)" -ForegroundColor Red
}

Write-Host "`n✅ État initial vérifié" -ForegroundColor Green
Write-Host "`n📋 Instructions:" -ForegroundColor Cyan
Write-Host "1. Appliquer les modifications du batch ${BatchNumber}"
Write-Host "2. Vérifier avec: pnpm type-check && pnpm build && pnpm test"
Write-Host "3. Créer le rapport: ${ReportFile}"
Write-Host "4. Commit: git commit -m 'fix: batch ${BatchNumber} - ${BatchName}'"
Write-Host "5. Push: git push origin ${BranchName}"
Write-Host ""
Write-Host "Branche créée: ${BranchName}" -ForegroundColor Green
Write-Host "Rapport à créer: ${ReportFile}" -ForegroundColor Green
