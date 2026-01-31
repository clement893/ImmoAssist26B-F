# Script de déploiement Railway pour Windows PowerShell
# Usage: .\scripts\deploy-railway.ps1 [environment]

param(
    [string]$Environment = "production"
)

$ErrorActionPreference = "Stop"
$ProjectDir = "apps/web"

Write-Host "🚀 Déploiement sur Railway - Environnement: $Environment" -ForegroundColor Cyan

# Vérifier que Railway CLI est installé
try {
    railway --version | Out-Null
} catch {
    Write-Host "❌ Railway CLI n'est pas installé. Installation..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Vérifier que l'utilisateur est connecté
try {
    railway whoami | Out-Null
} catch {
    Write-Host "🔐 Connexion à Railway..." -ForegroundColor Yellow
    railway login
}

# Aller dans le répertoire du projet
Set-Location $ProjectDir

# Déployer
Write-Host "📦 Déploiement en cours..." -ForegroundColor Cyan
railway up

Write-Host "✅ Déploiement terminé!" -ForegroundColor Green

