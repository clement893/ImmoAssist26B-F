# Script de vérification du build
# Vérifie TypeScript et le build Next.js avant chaque push

Write-Host "🔍 Vérification TypeScript..." -ForegroundColor Cyan
Set-Location apps/web

$tsCheck = & pnpm type-check 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreurs TypeScript détectées!" -ForegroundColor Red
    Write-Host $tsCheck
    exit 1
}

Write-Host "✅ TypeScript OK" -ForegroundColor Green

Write-Host "🔨 Vérification Build..." -ForegroundColor Cyan
$build = & pnpm build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreurs de build détectées!" -ForegroundColor Red
    Write-Host $build
    exit 1
}

Write-Host "✅ Build OK" -ForegroundColor Green
Write-Host "✅ Toutes les vérifications ont réussi!" -ForegroundColor Green

Set-Location ../..

