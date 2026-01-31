# PowerShell script to run the newly added API endpoint tests
# Usage: .\scripts\run_new_tests.ps1

Write-Host "🧪 Running New API Endpoint Tests" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""

# Run Search API tests
Write-Host "📊 Testing Search API endpoints..." -ForegroundColor Cyan
pytest tests/api/test_search_endpoints.py -v --tb=short
Write-Host ""

# Run Feedback API tests
Write-Host "💬 Testing Feedback API endpoints..." -ForegroundColor Cyan
pytest tests/api/test_feedback_endpoints.py -v --tb=short
Write-Host ""

# Run Comments API tests
Write-Host "💭 Testing Comments API endpoints..." -ForegroundColor Cyan
pytest tests/api/test_comments_endpoints.py -v --tb=short
Write-Host ""

# Run Tags API tests
Write-Host "🏷️  Testing Tags & Categories API endpoints..." -ForegroundColor Cyan
pytest tests/api/test_tags_endpoints.py -v --tb=short
Write-Host ""

Write-Host "✅ All new tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "To run with coverage:" -ForegroundColor Yellow
Write-Host "  pytest tests/api/test_*endpoints.py --cov=app --cov-report=html" -ForegroundColor Yellow

