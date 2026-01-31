#!/bin/bash
# Script to generate comprehensive coverage report
# Usage: ./scripts/generate_coverage_report.sh

set -e

echo "📊 Generating Test Coverage Report"
echo "===================================="
echo ""

# Generate coverage report for all tests
echo "Running tests with coverage..."
pytest tests/ \
    --cov=app \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=json \
    --cov-report=xml \
    --cov-branch \
    -v

echo ""
echo "✅ Coverage report generated!"
echo ""
echo "📄 Reports available:"
echo "  - Terminal: Summary above"
echo "  - HTML: backend/htmlcov/index.html"
echo "  - JSON: backend/coverage.json"
echo "  - XML: backend/coverage.xml"
echo ""
echo "Open htmlcov/index.html in your browser to view detailed coverage."

