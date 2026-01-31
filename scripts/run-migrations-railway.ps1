# Script pour exécuter les migrations Alembic sur Railway
# Usage: .\scripts\run-migrations-railway.ps1

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Exécution des migrations Alembic sur Railway" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier si Railway CLI est installé
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI n'est pas installé." -ForegroundColor Red
    Write-Host "Installation..." -ForegroundColor Yellow
    npm install -g @railway/cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de l'installation de Railway CLI" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Railway CLI installé" -ForegroundColor Green
}

# Vérifier si l'utilisateur est connecté
Write-Host "Vérification de la connexion Railway..." -ForegroundColor Yellow
$railwayStatus = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Vous n'êtes pas connecté à Railway" -ForegroundColor Red
    Write-Host "Connexion..." -ForegroundColor Yellow
    railway login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de la connexion" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Connecté à Railway" -ForegroundColor Green
Write-Host ""

# Naviguer vers le répertoire backend
$backendPath = Join-Path $PSScriptRoot ".." "backend"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Répertoire backend introuvable: $backendPath" -ForegroundColor Red
    exit 1
}

Push-Location $backendPath
Write-Host "Répertoire: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# Vérifier l'état actuel des migrations
Write-Host "Vérification de l'état actuel des migrations..." -ForegroundColor Yellow
railway run alembic current
Write-Host ""

# Afficher l'historique
Write-Host "Historique des migrations:" -ForegroundColor Yellow
railway run alembic history --verbose
Write-Host ""

# Demander confirmation
Write-Host "Voulez-vous exécuter les migrations? (O/N)" -ForegroundColor Yellow
$confirmation = Read-Host
if ($confirmation -ne "O" -and $confirmation -ne "o" -and $confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "Opération annulée" -ForegroundColor Yellow
    Pop-Location
    exit 0
}

# Exécuter les migrations
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Exécution des migrations..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
railway run alembic upgrade head

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migrations exécutées avec succès!" -ForegroundColor Green
    Write-Host ""
    
    # Vérifier l'état final
    Write-Host "État final des migrations:" -ForegroundColor Yellow
    railway run alembic current
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de l'exécution des migrations" -ForegroundColor Red
    Write-Host "Vérifiez les logs ci-dessus pour plus de détails" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Pop-Location
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Terminé!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
