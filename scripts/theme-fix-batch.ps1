# Theme Fix Batch Helper Script (PowerShell)
# Helps verify and commit batches

param(
    [Parameter(Mandatory=$true)]
    [int]$BatchNumber,
    
    [Parameter(Mandatory=$true)]
    [string]$BatchName
)

Write-Host "🔍 Verifying Batch $BatchNumber: $BatchName" -ForegroundColor Cyan
Write-Host ""

# TypeScript check
Write-Host "📝 Running TypeScript check..." -ForegroundColor Yellow
Set-Location apps/web
$tsResult = & pnpm type-check 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript check failed!" -ForegroundColor Red
    Write-Host $tsResult
    Set-Location ../..
    exit 1
}
Write-Host "✅ TypeScript check passed" -ForegroundColor Green
Write-Host ""

# Build check
Write-Host "🔨 Running build check..." -ForegroundColor Yellow
$buildResult = & pnpm build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build check failed!" -ForegroundColor Red
    Write-Host $buildResult
    Set-Location ../..
    exit 1
}
Write-Host "✅ Build check passed" -ForegroundColor Green
Write-Host ""

Set-Location ../..

# Git status
Write-Host "📊 Git status:" -ForegroundColor Cyan
git status --short
Write-Host ""

Write-Host "✅ All checks passed! Ready to commit." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Review changes: git diff"
Write-Host "2. Stage changes: git add ."
Write-Host "3. Commit: git commit -m 'fix(theme): migrate batch $BatchNumber - $BatchName'"
Write-Host "4. Push: git push"
Write-Host "5. Update THEME_FIX_PROGRESS.md"

