#!/bin/bash
# Script to test backend endpoints after migration
# Usage: ./scripts/test_endpoints.sh

set -e

echo "🧪 Testing Backend Endpoints"
echo "=============================="

BASE_URL="${API_URL:-http://localhost:8000}"
API_URL="${BASE_URL}/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" 2>&1)
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>&1)
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓${NC} (HTTP $http_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $http_code)"
        echo "  Response: $body"
        return 1
    fi
}

# Check if server is running
echo "Checking if backend server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${RED}Error: Backend server is not running at $BASE_URL${NC}"
    echo "Please start the backend server first:"
    echo "  cd backend && uvicorn app.main:app --reload"
    exit 1
fi

echo -e "${GREEN}Backend server is running${NC}"
echo ""

# Get auth token (you'll need to login first)
echo -e "${YELLOW}Note: You need to login first to get an auth token${NC}"
echo "Please provide your auth token (or press Enter to skip auth tests):"
read -r TOKEN

if [ -z "$TOKEN" ]; then
    echo "Skipping authenticated endpoints..."
    TOKEN=""
else
    echo "Testing authenticated endpoints..."
    echo ""
    
    # Test Pages API
    echo "📄 Testing Pages API"
    test_endpoint "GET" "/pages" "" "List pages"
    test_endpoint "POST" "/pages" '{"title":"Test Page","slug":"test-page","status":"draft"}' "Create page"
    test_endpoint "GET" "/pages/test-page" "" "Get page by slug"
    test_endpoint "PUT" "/pages/test-page" '{"title":"Updated Page"}' "Update page"
    test_endpoint "DELETE" "/pages/test-page" "" "Delete page"
    echo ""
    
    # Test Forms API
    echo "📝 Testing Forms API"
    test_endpoint "GET" "/forms" "" "List forms"
    test_endpoint "POST" "/forms" '{"name":"Test Form","fields":[]}' "Create form"
    echo ""
    
    # Test Menus API
    echo "🍔 Testing Menus API"
    test_endpoint "GET" "/menus" "" "List menus"
    test_endpoint "POST" "/menus" '{"name":"Test Menu","location":"header","items":[]}' "Create menu"
    echo ""
    
    # Test Support Tickets API
    echo "🎫 Testing Support Tickets API"
    test_endpoint "GET" "/support/tickets" "" "List tickets"
    test_endpoint "POST" "/support/tickets" '{"subject":"Test Ticket","category":"technical","priority":"medium","message":"Test message"}' "Create ticket"
    echo ""
    
    # Test SEO API
    echo "🔍 Testing SEO API"
    test_endpoint "GET" "/seo/settings" "" "Get SEO settings"
    test_endpoint "PUT" "/seo/settings" '{"title":"Test Site","description":"Test description"}' "Update SEO settings"
    echo ""
fi

# Test public endpoints
echo "🌐 Testing Public Endpoints"
test_endpoint "GET" "/health" "" "Health check" || true

echo ""
echo -e "${GREEN}✅ Endpoint testing complete!${NC}"


