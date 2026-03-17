# PowerShell test runner script with coverage reporting

Write-Host "Running tests with coverage..." -ForegroundColor Green

# Run tests with coverage
pytest tests/ `
    --cov=app `
    --cov-report=term-missing `
    --cov-report=html `
    --cov-report=xml `
    --cov-report=json `
    --cov-fail-under=70 `
    -v

Write-Host "`nCoverage report generated:" -ForegroundColor Green
Write-Host "  - HTML: htmlcov/index.html" -ForegroundColor Cyan
Write-Host "  - JSON: coverage.json" -ForegroundColor Cyan
Write-Host "  - XML: coverage.xml" -ForegroundColor Cyan

