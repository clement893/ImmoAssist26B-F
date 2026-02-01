# Lancer les migrations Alembic en local
# Usage:
#   .\scripts\run-migration-local.ps1
#   # ou avec DATABASE_URL déjà défini dans l'environnement
#
# Avec Docker (Postgres + backend):
#   docker compose up -d postgres
#   $env:DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db"
#   docker compose run --rm backend python -m alembic upgrade head
#
# Sans Docker (Postgres local): définir DATABASE_URL puis lancer ce script.

$ErrorActionPreference = "Stop"
$backendPath = Join-Path $PSScriptRoot ".." "backend"

if (-not (Test-Path $backendPath)) {
    Write-Host "Repertoire backend introuvable: $backendPath" -ForegroundColor Red
    exit 1
}

if (-not $env:DATABASE_URL) {
    Write-Host "DATABASE_URL non defini. Exemple:" -ForegroundColor Yellow
    Write-Host '  $env:DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db"' -ForegroundColor Gray
    Write-Host "Puis relancez ce script." -ForegroundColor Yellow
    exit 1
}

Push-Location $backendPath
try {
    Write-Host "Migration Alembic (upgrade head)..." -ForegroundColor Cyan
    python -m alembic upgrade head
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Migration appliquee avec succes." -ForegroundColor Green
    } else {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
