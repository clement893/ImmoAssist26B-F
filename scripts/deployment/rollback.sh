#!/bin/bash

# Deployment Rollback Script
# Rolls back to previous deployment version
# Usage: ./scripts/deployment/rollback.sh [platform] [service]

set -e

PLATFORM=${1:-"railway"}
SERVICE=${2:-"all"}  # all, frontend, backend

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 Starting rollback process...${NC}"
echo "Platform: $PLATFORM"
echo "Service: $SERVICE"
echo ""

# Function to rollback Railway deployment
rollback_railway() {
    local service=$1
    
    if ! command -v railway &> /dev/null; then
        echo -e "${RED}❌ Railway CLI is not installed${NC}"
        echo "Install it with: npm install -g @railway/cli"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Rolling back Railway deployment...${NC}"
    
    if [ "$service" = "frontend" ] || [ "$service" = "all" ]; then
        echo "Rolling back frontend..."
        railway rollback --service $RAILWAY_FRONTEND_SERVICE_ID || {
            echo -e "${RED}❌ Frontend rollback failed${NC}"
            exit 1
        }
        echo -e "${GREEN}✅ Frontend rolled back${NC}"
    fi
    
    if [ "$service" = "backend" ] || [ "$service" = "all" ]; then
        echo "Rolling back backend..."
        railway rollback --service $RAILWAY_BACKEND_SERVICE_ID || {
            echo -e "${RED}❌ Backend rollback failed${NC}"
            exit 1
        }
        echo -e "${GREEN}✅ Backend rolled back${NC}"
    fi
}

# Function to rollback Vercel deployment
rollback_vercel() {
    if ! command -v vercel &> /dev/null; then
        echo -e "${RED}❌ Vercel CLI is not installed${NC}"
        echo "Install it with: npm install -g vercel"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Rolling back Vercel deployment...${NC}"
    
    # Get previous deployment
    PREVIOUS_DEPLOYMENT=$(vercel ls --json | jq -r '.[1].uid' 2>/dev/null || echo "")
    
    if [ -z "$PREVIOUS_DEPLOYMENT" ]; then
        echo -e "${RED}❌ No previous deployment found${NC}"
        exit 1
    fi
    
    echo "Rolling back to deployment: $PREVIOUS_DEPLOYMENT"
    vercel rollback $PREVIOUS_DEPLOYMENT --yes || {
        echo -e "${RED}❌ Rollback failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Rolled back to previous deployment${NC}"
}

# Function to rollback using Git
rollback_git() {
    local service=$1
    
    echo -e "${YELLOW}⚠️  Rolling back using Git...${NC}"
    
    # Get previous commit
    PREVIOUS_COMMIT=$(git log --oneline -n 2 | tail -n 1 | cut -d' ' -f1)
    
    if [ -z "$PREVIOUS_COMMIT" ]; then
        echo -e "${RED}❌ No previous commit found${NC}"
        exit 1
    fi
    
    echo "Rolling back to commit: $PREVIOUS_COMMIT"
    echo -e "${YELLOW}⚠️  This will create a new commit reverting changes${NC}"
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Rollback cancelled"
        exit 0
    fi
    
    git revert HEAD --no-edit || {
        echo -e "${RED}❌ Git rollback failed${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Rollback commit created${NC}"
    echo "Push the changes to trigger redeployment:"
    echo "  git push origin main"
}

# Main rollback logic
case $PLATFORM in
    railway)
        rollback_railway $SERVICE
        ;;
    vercel)
        rollback_vercel
        ;;
    git)
        rollback_git $SERVICE
        ;;
    *)
        echo -e "${RED}❌ Unknown platform: $PLATFORM${NC}"
        echo "Supported platforms: railway, vercel, git"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Rollback completed successfully${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the rollback with health checks"
echo "2. Monitor logs for any issues"
echo "3. Investigate the cause of the failed deployment"

