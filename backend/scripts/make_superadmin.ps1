# PowerShell script to make a user superadmin
# Requires psql to be installed and in PATH
# Usage: $env:DATABASE_URL='postgresql://...'; $env:SUPERADMIN_EMAIL='email@example.com'; .\make_superadmin.ps1
# OR: .\make_superadmin.ps1 'postgresql://...' 'email@example.com'

# Get database URL from environment variable or command line argument
$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl -and $args.Count -ge 1) {
    $databaseUrl = $args[0]
}
if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL not set. Please set it as environment variable or pass as argument:" -ForegroundColor Red
    Write-Host "   `$env:DATABASE_URL = 'postgresql://user:password@host:port/database'" -ForegroundColor Yellow
    Write-Host "   OR" -ForegroundColor Yellow
    Write-Host "   .\make_superadmin.ps1 'postgresql://user:password@host:port/database' 'email@example.com'" -ForegroundColor Yellow
    exit 1
}

# Get email from environment variable or command line argument
$email = $env:SUPERADMIN_EMAIL
if (-not $email -and $args.Count -ge 2) {
    $email = $args[1]
}
if (-not $email) {
    $email = "clement@nukleo.com"  # Default email - change as needed
    Write-Host "⚠️  Using default email: $email" -ForegroundColor Yellow
    Write-Host "   Set SUPERADMIN_EMAIL environment variable or pass as second argument to use different email" -ForegroundColor Gray
}

Write-Host "🔧 Making '$email' superadmin..." -ForegroundColor Cyan
Write-Host ""

# SQL commands
$sql = @"
-- Ensure superadmin role exists
INSERT INTO roles (name, slug, description, is_system, is_active, created_at, updated_at)
VALUES ('Super Admin', 'superadmin', 'Super administrator with full system access', true, true, NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Add superadmin role to user
INSERT INTO user_roles (user_id, role_id, created_at)
SELECT u.id, r.id, NOW()
FROM users u
CROSS JOIN roles r
WHERE u.email = '$email'
  AND r.slug = 'superadmin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Verify
SELECT 
    u.email,
    r.name as role_name,
    ur.created_at as assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = '$email' AND r.slug = 'superadmin';
"@

# Try to execute with psql if available
if (Get-Command psql -ErrorAction SilentlyContinue) {
    Write-Host "Executing SQL via psql..." -ForegroundColor Yellow
    $sql | psql $databaseUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✅ Success! User '$email' is now a superadmin." -ForegroundColor Green
    } else {
        Write-Host "`n❌ Error executing SQL. Please execute manually." -ForegroundColor Red
        Write-Host "`nSQL to execute:" -ForegroundColor Yellow
        Write-Host $sql
    }
} else {
    Write-Host "⚠️  psql not found in PATH." -ForegroundColor Yellow
    Write-Host "`nPlease execute the following SQL in your PostgreSQL client:" -ForegroundColor Cyan
    Write-Host "`n$sql" -ForegroundColor White
    Write-Host "`nOr use the SQL file: backend/scripts/make_superadmin_simple.sql" -ForegroundColor Cyan
}


