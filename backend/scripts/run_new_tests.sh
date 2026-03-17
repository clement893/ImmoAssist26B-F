#!/bin/bash
# Script to run the newly added API endpoint tests
# Usage: ./scripts/run_new_tests.sh

set -e

echo "🧪 Running New API Endpoint Tests"
echo "=================================="
echo ""

# Run Search API tests
echo "📊 Testing Search API endpoints..."
pytest tests/api/test_search_endpoints.py -v --tb=short
echo ""

# Run Feedback API tests
echo "💬 Testing Feedback API endpoints..."
pytest tests/api/test_feedback_endpoints.py -v --tb=short
echo ""

# Run Comments API tests
echo "💭 Testing Comments API endpoints..."
pytest tests/api/test_comments_endpoints.py -v --tb=short
echo ""

# Run Tags API tests
echo "🏷️  Testing Tags & Categories API endpoints..."
pytest tests/api/test_tags_endpoints.py -v --tb=short
echo ""

echo "✅ All new tests completed!"
echo ""
echo "To run with coverage:"
echo "  pytest tests/api/test_*endpoints.py --cov=app --cov-report=html"

