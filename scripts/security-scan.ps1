# Security Scan Script (PowerShell)
# Scans codebase for potential secrets and security issues

Write-Host "🔍 Running Security Scan..." -ForegroundColor Cyan

$foundSecrets = 0

function Check-Secret {
    param(
        [string]$Pattern,
        [string]$Description
    )
    
    $files = Get-ChildItem -Recurse -Include *.py,*.ts,*.tsx,*.js,*.jsx,*.md -Exclude node_modules,.next,dist,build,.git | 
        Select-String -Pattern $Pattern -List | 
        Select-Object -ExpandProperty Path -Unique
    
    if ($files) {
        Write-Host "⚠️  $Description found in:" -ForegroundColor Red
        $files | ForEach-Object { Write-Host "  - $_" }
        $script:foundSecrets++
    } else {
        Write-Host "✅ No $Description found" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Checking for potential secrets..." -ForegroundColor Yellow

# Check for API keys
Check-Secret -Pattern "sk_live_[a-zA-Z0-9]{24,}" -Description "Stripe live secret keys"
Check-Secret -Pattern "sk_test_[a-zA-Z0-9]{24,}" -Description "Stripe test secret keys"
Check-Secret -Pattern "AKIA[0-9A-Z]{16}" -Description "AWS access keys"
Check-Secret -Pattern "SG\.[a-zA-Z0-9_-]{22}" -Description "SendGrid API keys"
Check-Secret -Pattern "AIza[0-9A-Za-z_-]{35}" -Description "Google API keys"
Check-Secret -Pattern "ghp_[a-zA-Z0-9]{36}" -Description "GitHub personal access tokens"

# Check for hardcoded passwords
Check-Secret -Pattern "password\s*=\s*['`"][^'`"]{8,}['`"]" -Description "Hardcoded passwords"
Check-Secret -Pattern "PASSWORD\s*=\s*['`"][^'`"]{8,}['`"]" -Description "Hardcoded PASSWORD variables"

# Check for hardcoded secrets
Check-Secret -Pattern "secret\s*=\s*['`"][^'`"]{16,}['`"]" -Description "Hardcoded secrets"
Check-Secret -Pattern "SECRET\s*=\s*['`"][^'`"]{16,}['`"]" -Description "Hardcoded SECRET variables"

# Check for database URLs with passwords
Check-Secret -Pattern "postgresql://[^:]+:[^@]+@|mysql://[^:]+:[^@]+@|mongodb://[^:]+:[^@]+@" -Description "Database URLs with credentials"

Write-Host ""
Write-Host "Checking for .env files in repository..." -ForegroundColor Yellow
$envFiles = git ls-files | Select-String "\.env$"
if ($envFiles) {
    Write-Host "⚠️  .env files found in repository:" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "  - $_" }
    $foundSecrets++
} else {
    Write-Host "✅ No .env files in repository" -ForegroundColor Green
}

Write-Host ""
if ($foundSecrets -eq 0) {
    Write-Host "✅ Security scan passed! No secrets found." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Security scan failed! Found $foundSecrets potential security issues." -ForegroundColor Red
    Write-Host "Please review the findings above and remove any hardcoded secrets." -ForegroundColor Yellow
    exit 1
}

