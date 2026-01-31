#!/bin/bash
# Test runner script with coverage reporting

set -e

echo "Running tests with coverage..."

# Run tests with coverage
pytest tests/ \
    --cov=app \
    --cov-report=term-missing \
    --cov-report=html \
    --cov-report=xml \
    --cov-report=json \
    --cov-fail-under=70 \
    -v

echo "Coverage report generated in htmlcov/index.html"
echo "Coverage JSON report: coverage.json"
echo "Coverage XML report: coverage.xml"

