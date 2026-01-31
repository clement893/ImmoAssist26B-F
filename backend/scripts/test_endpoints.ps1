# PowerShell script to test backend endpoints after migration
# Usage: .\scripts\test_endpoints.ps1

$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Backend Endpoints" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:8000" }
$API_URL = "$BASE_URL/api/v1"

# Check if server is running
Write-Host "Checking if backend server is running..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend server is not running at $BASE_URL" -ForegroundColor Red
    Write-Host "Please start the backend server first:" -ForegroundColor Yellow
    Write-Host "  cd backend && uvicorn app.main:app --reload" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Note: You need to login first to get an auth token" -ForegroundColor Yellow
Write-Host "Please provide your auth token (or press Enter to skip auth tests):" -ForegroundColor Yellow
$TOKEN = Read-Host

if ([string]::IsNullOrWhiteSpace($TOKEN)) {
    Write-Host "Skipping authenticated endpoints..." -ForegroundColor Yellow
} else {
    Write-Host "Testing authenticated endpoints..." -ForegroundColor Green
    Write-Host ""
    
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    # Test Pages API
    Write-Host "📄 Testing Pages API" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/pages" -Method GET -Headers $headers
        Write-Host "  ✓ List pages" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ List pages: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    try {
        $pageData = @{
            title = "Test Page"
            slug = "test-page"
            status = "draft"
        } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$API_URL/pages" -Method POST -Headers $headers -Body $pageData
        Write-Host "  ✓ Create page" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Create page: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test Forms API
    Write-Host "📝 Testing Forms API" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/forms" -Method GET -Headers $headers
        Write-Host "  ✓ List forms" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ List forms: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test Menus API
    Write-Host "🍔 Testing Menus API" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/menus" -Method GET -Headers $headers
        Write-Host "  ✓ List menus" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ List menus: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test Support Tickets API
    Write-Host "🎫 Testing Support Tickets API" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/support/tickets" -Method GET -Headers $headers
        Write-Host "  ✓ List tickets" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ List tickets: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test SEO API
    Write-Host "🔍 Testing SEO API" -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/seo/settings" -Method GET -Headers $headers
        Write-Host "  ✓ Get SEO settings" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ Get SEO settings: $($_.Exception.Message)" -ForegroundColor Red
    }
    Write-Host ""
}

# Test public endpoints
Write-Host "🌐 Testing Public Endpoints" -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method GET
    Write-Host "  ✓ Health check" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Health check: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Endpoint testing complete!" -ForegroundColor Green


