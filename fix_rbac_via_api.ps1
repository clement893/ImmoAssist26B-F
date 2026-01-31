# Script PowerShell pour corriger RBAC via l'API
param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [string]$BootstrapKey = "",
    [string]$ApiUrl = "https://modelebackend-production-0590.up.railway.app"
)

Write-Host "🔧 RBAC Fix via API" -ForegroundColor Cyan
Write-Host "=" * 60

# Étape 1: Diagnostic
Write-Host "`n📊 Étape 1: Diagnostic..." -ForegroundColor Yellow
try {
    $diagnoseUrl = "$ApiUrl/api/v1/admin/rbac/diagnose?user_email=$Email"
    $response = Invoke-RestMethod -Uri $diagnoseUrl -Method GET -ContentType "application/json" -ErrorAction Stop
    
    Write-Host "✅ Diagnostic réussi!" -ForegroundColor Green
    Write-Host "   Rôles dans la DB: $($response.roles_count)" -ForegroundColor Gray
    Write-Host "   Permissions dans la DB: $($response.permissions_count)" -ForegroundColor Gray
    Write-Host "   Utilisateur a superadmin: $($response.user_has_superadmin)" -ForegroundColor Gray
    Write-Host "   Rôles de l'utilisateur: $($response.user_roles -join ', ')" -ForegroundColor Gray
    
    if ($response.recommendations.Count -gt 0) {
        Write-Host "`n💡 Recommandations:" -ForegroundColor Yellow
        foreach ($rec in $response.recommendations) {
            Write-Host "   - $rec" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "⚠️  Endpoint de diagnostic non disponible (peut-être pas encore déployé)" -ForegroundColor Yellow
    Write-Host "   Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n   Continuons avec la méthode alternative..." -ForegroundColor Yellow
}

# Étape 2: Utiliser l'endpoint bootstrap-superadmin
Write-Host "`n🛠️  Étape 2: Correction via bootstrap-superadmin..." -ForegroundColor Yellow

if ([string]::IsNullOrEmpty($BootstrapKey)) {
    Write-Host "⚠️  Aucune clé bootstrap fournie." -ForegroundColor Yellow
    Write-Host "   Tentative avec l'endpoint /bootstrap-superadmin..." -ForegroundColor Gray
    
    # Essayer sans clé (peut-être que l'endpoint permet cela dans certains cas)
    try {
        $bootstrapUrl = "$ApiUrl/api/v1/admin/bootstrap-superadmin"
        $body = @{
            email = $Email
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        $response = Invoke-RestMethod -Uri $bootstrapUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
        Write-Host "✅ Superadmin assigné avec succès!" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`n💡 Solutions alternatives:" -ForegroundColor Yellow
        Write-Host "   1. Configurer BOOTSTRAP_SUPERADMIN_KEY dans Railway et réessayer" -ForegroundColor Gray
        Write-Host "   2. Utiliser Railway CLI: railway run python backend/scripts/fix_rbac_direct.py --user-email $Email --seed-data --assign-superadmin" -ForegroundColor Gray
        Write-Host "   3. Se connecter manuellement et utiliser l'endpoint /make-superadmin" -ForegroundColor Gray
        exit 1
    }
} else {
    Write-Host "   Utilisation de la clé bootstrap fournie..." -ForegroundColor Gray
    try {
        $bootstrapUrl = "$ApiUrl/api/v1/admin/bootstrap-superadmin"
        $body = @{
            email = $Email
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
            "X-Bootstrap-Key" = $BootstrapKey
        }
        
        $response = Invoke-RestMethod -Uri $bootstrapUrl -Method POST -Body $body -Headers $headers -ErrorAction Stop
        Write-Host "✅ Superadmin assigné avec succès!" -ForegroundColor Green
        Write-Host "   Message: $($response.message)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ Échec: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ Correction terminée!" -ForegroundColor Green
Write-Host "`n⚠️  IMPORTANT: Reconnectez-vous dans l'application pour obtenir un nouveau token JWT" -ForegroundColor Yellow
