# Script pour tester les endpoints RBAC
# Usage: .\test_rbac_endpoints.ps1 -Token "votre_jwt_token"

param(
    [Parameter(Mandatory=$true)]
    [string]$Token,
    
    [string]$ApiUrl = "https://modelebackend-production-0590.up.railway.app"
)

$BaseUrl = "$ApiUrl/api/v1"
$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

Write-Host "🧪 Test des Endpoints RBAC" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# Liste des endpoints à tester
$endpoints = @(
    @{
        Name = "GET /rbac/roles"
        Url = "$BaseUrl/rbac/roles?skip=0&limit=100"
        Method = "GET"
    },
    @{
        Name = "GET /rbac/permissions"
        Url = "$BaseUrl/rbac/permissions"
        Method = "GET"
    },
    @{
        Name = "GET /rbac/users/3/roles"
        Url = "$BaseUrl/rbac/users/3/roles"
        Method = "GET"
    },
    @{
        Name = "GET /rbac/users/3/permissions"
        Url = "$BaseUrl/rbac/users/3/permissions"
        Method = "GET"
    },
    @{
        Name = "GET /rbac/users/3/permissions/custom"
        Url = "$BaseUrl/rbac/users/3/permissions/custom"
        Method = "GET"
    }
)

$successCount = 0
$failCount = 0

foreach ($endpoint in $endpoints) {
    Write-Host "📡 Test: $($endpoint.Name)" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -Method $endpoint.Method -Headers $headers -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "   ✅ SUCCESS (200 OK)" -ForegroundColor Green
            
            # Afficher un aperçu de la réponse
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                if ($jsonResponse -is [Array]) {
                    Write-Host "   📊 Réponse: Array avec $($jsonResponse.Count) éléments" -ForegroundColor Gray
                } elseif ($jsonResponse.roles) {
                    Write-Host "   📊 Réponse: $($jsonResponse.roles.Count) rôles trouvés" -ForegroundColor Gray
                } elseif ($jsonResponse -is [String]) {
                    Write-Host "   📊 Réponse: $($jsonResponse.Count) permissions" -ForegroundColor Gray
                } else {
                    Write-Host "   📊 Réponse: Objet JSON reçu" -ForegroundColor Gray
                }
            } catch {
                Write-Host "   📊 Réponse: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
            }
            
            $successCount++
        } else {
            Write-Host "   ⚠️  Status: $($response.StatusCode)" -ForegroundColor Yellow
            $failCount++
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        if ($statusCode -eq 403) {
            Write-Host "   ❌ FORBIDDEN (403) - Permissions insuffisantes" -ForegroundColor Red
            Write-Host "   💡 Vérifiez que vous êtes bien reconnecté avec un nouveau token" -ForegroundColor Yellow
        } elseif ($statusCode -eq 401) {
            Write-Host "   ❌ UNAUTHORIZED (401) - Token invalide ou expiré" -ForegroundColor Red
            Write-Host "   💡 Reconnectez-vous pour obtenir un nouveau token" -ForegroundColor Yellow
        } elseif ($statusCode -eq 404) {
            Write-Host "   ⚠️  NOT FOUND (404) - Endpoint non trouvé" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ ERREUR ($statusCode): $errorMessage" -ForegroundColor Red
        }
        
        # Afficher les détails de l'erreur si disponibles
        if ($_.ErrorDetails.Message) {
            try {
                $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
                if ($errorDetails.detail) {
                    Write-Host "   📝 Détail: $($errorDetails.detail)" -ForegroundColor Gray
                }
            } catch {
                Write-Host "   📝 Détail: $($_.ErrorDetails.Message)" -ForegroundColor Gray
            }
        }
        
        $failCount++
    }
    
    Write-Host ""
}

# Résumé
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "📊 Résumé des Tests" -ForegroundColor Cyan
Write-Host "   ✅ Succès: $successCount" -ForegroundColor Green
Write-Host "   ❌ Échecs: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "🎉 Tous les endpoints RBAC fonctionnent correctement !" -ForegroundColor Green
    Write-Host "   Vous avez maintenant accès à toutes les fonctionnalités RBAC." -ForegroundColor Gray
} else {
    Write-Host "⚠️  Certains endpoints ont échoué." -ForegroundColor Yellow
    Write-Host "   Vérifiez que:" -ForegroundColor Yellow
    Write-Host "   1. Vous êtes bien reconnecté dans l'application" -ForegroundColor Gray
    Write-Host "   2. Le token JWT est valide et non expiré" -ForegroundColor Gray
    Write-Host "   3. Le rôle superadmin est bien assigné à votre compte" -ForegroundColor Gray
}

Write-Host ""
