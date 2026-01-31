#!/bin/bash
# Security Scan Script
# Scans codebase for potential secrets and security issues

set -e

echo "🔍 Running Security Scan..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FOUND_SECRETS=0

# Function to check for secrets
check_secret() {
    local pattern=$1
    local description=$2
    local files=$(grep -r -l -E "$pattern" --include="*.py" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.md" --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=build --exclude-dir=.git 2>/dev/null || true)
    
    if [ -n "$files" ]; then
        echo -e "${RED}⚠️  $description found in:${NC}"
        echo "$files" | while read -r file; do
            echo "  - $file"
        done
        FOUND_SECRETS=$((FOUND_SECRETS + 1))
    else
        echo -e "${GREEN}✅ No $description found${NC}"
    fi
}

echo ""
echo "Checking for potential secrets..."

# Check for API keys
check_secret "sk_live_[a-zA-Z0-9]{24,}" "Stripe live secret keys"
check_secret "sk_test_[a-zA-Z0-9]{24,}" "Stripe test secret keys"
check_secret "AKIA[0-9A-Z]{16}" "AWS access keys"
check_secret "SG\\.[a-zA-Z0-9_-]{22}" "SendGrid API keys"
check_secret "AIza[0-9A-Za-z_-]{35}" "Google API keys"
check_secret "ghp_[a-zA-Z0-9]{36}" "GitHub personal access tokens"
check_secret "xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,32}" "Slack tokens"

# Check for hardcoded passwords
check_secret "password\\s*=\\s*['\"][^'\"]{8,}['\"]" "Hardcoded passwords"
check_secret "PASSWORD\\s*=\\s*['\"][^'\"]{8,}['\"]" "Hardcoded PASSWORD variables"

# Check for hardcoded secrets
check_secret "secret\\s*=\\s*['\"][^'\"]{16,}['\"]" "Hardcoded secrets"
check_secret "SECRET\\s*=\\s*['\"][^'\"]{16,}['\"]" "Hardcoded SECRET variables"

# Check for database URLs with passwords
check_secret "postgresql://[^:]+:[^@]+@|mysql://[^:]+:[^@]+@|mongodb://[^:]+:[^@]+@" "Database URLs with credentials"

# Check for JWT secrets (should be in env vars only)
check_secret "jwt.*secret.*=.*['\"][^'\"]{32,}['\"]" "Hardcoded JWT secrets"

echo ""
echo "Checking for .env files in repository..."
if git ls-files | grep -q "\.env$"; then
    echo -e "${RED}⚠️  .env files found in repository:${NC}"
    git ls-files | grep "\.env$" | while read -r file; do
        echo "  - $file"
    done
    FOUND_SECRETS=$((FOUND_SECRETS + 1))
else
    echo -e "${GREEN}✅ No .env files in repository${NC}"
fi

echo ""
if [ $FOUND_SECRETS -eq 0 ]; then
    echo -e "${GREEN}✅ Security scan passed! No secrets found.${NC}"
    exit 0
else
    echo -e "${RED}❌ Security scan failed! Found $FOUND_SECRETS potential security issues.${NC}"
    echo -e "${YELLOW}Please review the findings above and remove any hardcoded secrets.${NC}"
    exit 1
fi

