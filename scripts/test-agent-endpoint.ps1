$baseUrl = "https://agentia-immo-production.up.railway.app"
# Test 1: GET (vérifier si le serveur répond - peut retourner 405 Method Not Allowed, c'est normal)
Write-Host "Test 1: GET /api/external/agent/chat (attendu: 405 ou 404)" -ForegroundColor Cyan
try {
  $r1 = Invoke-WebRequest -Uri "$baseUrl/api/external/agent/chat" -Method GET -UseBasicParsing
  Write-Host "  Status: $($r1.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "  Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
}

# Test 2: POST sans clé (attendu: 401 ou 403)
Write-Host "`nTest 2: POST sans X-API-Key (attendu: 401/403)" -ForegroundColor Cyan
try {
  $body = '{"message":"test"}'
  $r2 = Invoke-WebRequest -Uri "$baseUrl/api/external/agent/chat" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
  Write-Host "  Status: $($r2.StatusCode)" -ForegroundColor Green
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "  Status: $code" -ForegroundColor $(if ($code -eq 401 -or $code -eq 403) { "Green" } else { "Yellow" })
}

# Test 3: POST avec clé (remplace TA_CLE par ta AGENT_API_KEY pour un vrai test)
$key = $env:AGENT_API_KEY
if (-not $key) { $key = "7417d4455dc11ebeb0fdc13f292fefe16e7cf1ad96268baa09dadf533ac49a9d" }
Write-Host "`nTest 3: POST avec X-API-Key" -ForegroundColor Cyan
try {
  $headers = @{
    "Content-Type" = "application/json"
    "X-API-Key"   = $key
  }
  $body = '{"message":"test"}'
  $r3 = Invoke-WebRequest -Uri "$baseUrl/api/external/agent/chat" -Method POST -Headers $headers -Body $body -UseBasicParsing
  Write-Host "  Status: $($r3.StatusCode)" -ForegroundColor Green
  Write-Host "  Body: $($r3.Content.Substring(0, [Math]::Min(200, $r3.Content.Length)))..." -ForegroundColor Gray
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Write-Host "  Status: $code" -ForegroundColor $(if ($code -eq 200) { "Green" } elseif ($code -eq 404) { "Red" } else { "Yellow" })
  if ($code -eq 404) { Write-Host "  -> L'endpoint n'existe pas sur l'agent Django. Verifier les urls.py du projet agent." -ForegroundColor Red }
}
