# Script PowerShell pour diagnostiquer et corriger RBAC via l'API
# Usage: .\fix_rbac_api.ps1 -Email "votre@email.com" [-BootstrapKey "votre_key"] [-Fix]

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$BootstrapKey = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$Fix = $false
)

$BaseUrl = "https://modelebackend-production-0590.up.railway.app/api/v1"

Write-Host "🔍 Diagnostic RBAC pour: $Email" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Étape 1: Diagnostic
Write-Host "`n📊 Étape 1: Diagnostic..." -ForegroundColor Yellow

try {
    $diagnoseUrl = "$BaseUrl/admin/rbac/diagnose?user_email=$Email"
    $diagnoseResponse = Invoke-RestMethod -Uri $diagnoseUrl -Method Get -ContentType "application/json"
    
    Write-Host "`n✅ Diagnostic réussi!" -ForegroundColor Green
    Write-Host "   Rôles dans la base de données: $($diagnoseResponse.roles_count)" -ForegroundColor White
    Write-Host "   Permissions dans la base de données: $($diagnoseResponse.permissions_count)" -ForegroundColor White
    Write-Host "   Utilisateur a superadmin: $($diagnoseResponse.user_has_superadmin)" -ForegroundColor $(if ($diagnoseResponse.user_has_superadmin) { "Green" } else { "Red" })
    Write-Host "   Rôles de l'utilisateur: $($diagnoseResponse.user_roles -join ', ')" -ForegroundColor White
    Write-Host "   Permissions de l'utilisateur: $($diagnoseResponse.user_permissions.Count)" -ForegroundColor White
    
    Write-Host "`n   🔒 Statut des permissions requises:" -ForegroundColor Yellow
    foreach ($perm in $diagnoseResponse.required_permissions_status.PSObject.Properties) {
        $status = if ($perm.Value) { "✅" } else { "❌" }
        Write-Host "      $status $($perm.Name): $($perm.Value)" -ForegroundColor $(if ($perm.Value) { "Green" } else { "Red" })
    }
    
    Write-Host "`n   💡 Recommandations:" -ForegroundColor Yellow
    foreach ($rec in $diagnoseResponse.recommendations) {
        Write-Host "      - $rec" -ForegroundColor White
    }
    
    # Étape 2: Correction si demandée
    if ($Fix) {
        Write-Host "`n🛠️  Étape 2: Correction..." -ForegroundColor Yellow
        
        $fixUrl = "$BaseUrl/admin/rbac/fix"
        $fixBody = @{
            user_email = $Email
            seed_data = $true
            assign_superadmin = $true
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($BootstrapKey) {
            $headers["X-Bootstrap-Key"] = $BootstrapKey
            Write-Host "   Utilisation de la bootstrap key..." -ForegroundColor Gray
        }
        
        try {
            $fixResponse = Invoke-RestMethod -Uri $fixUrl -Method Post -Body $fixBody -Headers $headers -ContentType "application/json"
            
            Write-Host "`n✅ Correction réussie!" -ForegroundColor Green
            Write-Host "   Rôles créés: $($fixResponse.roles_created)" -ForegroundColor White
            Write-Host "   Permissions créées: $($fixResponse.permissions_created)" -ForegroundColor White
            Write-Host "   Superadmin assigné: $($fixResponse.superadmin_assigned)" -ForegroundColor $(if ($fixResponse.superadmin_assigned) { "Green" } else { "Yellow" })
            Write-Host "`n   Message: $($fixResponse.message)" -ForegroundColor White
            
            Write-Host "`n🔄 Vérification post-correction..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
            
            $verifyResponse = Invoke-RestMethod -Uri $diagnoseUrl -Method Get -ContentType "application/json"
            
            Write-Host "`n✅ Vérification:" -ForegroundColor Green
            Write-Host "   Utilisateur a superadmin: $($verifyResponse.user_has_superadmin)" -ForegroundColor $(if ($verifyResponse.user_has_superadmin) { "Green" } else { "Red" })
            Write-Host "   Rôles de l'utilisateur: $($verifyResponse.user_roles -join ', ')" -ForegroundColor White
            
            $allPermsOk = $true
            foreach ($perm in $verifyResponse.required_permissions_status.PSObject.Properties) {
                if (-not $perm.Value) {
                    $allPermsOk = $false
                    break
                }
            }
            
            if ($allPermsOk) {
                Write-Host "`n🎉 Toutes les permissions requises sont maintenant actives!" -ForegroundColor Green
                Write-Host "`n⚠️  IMPORTANT: Reconnectez-vous dans l'application pour obtenir un nouveau token JWT." -ForegroundColor Yellow
            } else {
                Write-Host "`n⚠️  Certaines permissions sont encore manquantes. Vérifiez les logs." -ForegroundColor Yellow
            }
            
        } catch {
            Write-Host "`n❌ Erreur lors de la correction:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
            
            if ($_.ErrorDetails.Message) {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($errorDetails) {
                    Write-Host "   Détail: $($errorDetails.detail)" -ForegroundColor Red
                } else {
                    Write-Host "   Détail: $($_.ErrorDetails.Message)" -ForegroundColor Red
                }
            }
            
            Write-Host "`n💡 Suggestions:" -ForegroundColor Yellow
            Write-Host "   - Vérifiez que l'endpoint /rbac/fix est déployé" -ForegroundColor White
            Write-Host "   - Si vous avez une bootstrap key, utilisez: -BootstrapKey 'votre_key'" -ForegroundColor White
            Write-Host "   - Vérifiez que l'utilisateur existe dans la base de données" -ForegroundColor White
        }
    } else {
        Write-Host "`n💡 Pour corriger automatiquement, exécutez:" -ForegroundColor Yellow
        Write-Host "   .\fix_rbac_api.ps1 -Email '$Email' -Fix" -ForegroundColor White
        if ($BootstrapKey) {
            Write-Host "   .\fix_rbac_api.ps1 -Email '$Email' -BootstrapKey '$BootstrapKey' -Fix" -ForegroundColor White
        }
    }
    
} catch {
    Write-Host "`n❌ Erreur lors du diagnostic:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "   Détail: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    
    Write-Host "`n💡 Vérifiez que:" -ForegroundColor Yellow
    Write-Host "   - L'API backend est accessible" -ForegroundColor White
    Write-Host "   - L'endpoint /rbac/diagnose est déployé" -ForegroundColor White
    Write-Host "   - L'email est correct" -ForegroundColor White
}

$separator = "=" * 60
Write-Host ""
Write-Host $separator -ForegroundColor Cyan
