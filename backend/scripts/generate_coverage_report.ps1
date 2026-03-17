# PowerShell script to generate comprehensive coverage report
# Usage: .\scripts\generate_coverage_report.ps1

Write-Host "📊 Generating Test Coverage Report" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""

# Generate coverage report for all tests
Write-Host "Running tests with coverage..." -ForegroundColor Cyan
pytest tests/ `
    --cov=app `
    --cov-report=term-missing `
    --cov-report=html `
    --cov-report=json `
    --cov-report=xml `
    --cov-branch `
    -v

Write-Host ""
Write-Host "✅ Coverage report generated!" -ForegroundColor Green
Write-Host ""
Write-Host "📄 Reports available:" -ForegroundColor Yellow
Write-Host "  - Terminal: Summary above" -ForegroundColor White
Write-Host "  - HTML: backend/htmlcov/index.html" -ForegroundColor White
Write-Host "  - JSON: backend/coverage.json" -ForegroundColor White
Write-Host "  - XML: backend/coverage.xml" -ForegroundColor White
Write-Host ""
Write-Host "Open htmlcov/index.html in your browser to view detailed coverage." -ForegroundColor Cyan

