#!/bin/bash

# Simple Production Deployment
# This pushes to a special branch that triggers production deployment

echo "🚀 SIMPLE PRODUCTION DEPLOYMENT"
echo "==============================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  WARNING: Deploying to PRODUCTION!${NC}"
echo "Target: https://locumtruerate-66ba3177c382.herokuapp.com"
echo ""
echo "Current state:"
echo "Branch: $(git branch --show-current)"
echo "Latest commit: $(git log --oneline -1)"
echo ""

# Confirm deployment
read -p "Type 'PRODUCTION' to confirm: " confirm

if [ "$confirm" != "PRODUCTION" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Triggering production deployment...${NC}"

# Create and push production-deploy branch
echo "Creating production-deploy branch..."
git checkout -b production-deploy 2>/dev/null || git checkout production-deploy
git reset --hard vanilla-only
git push origin production-deploy --force

echo ""
echo -e "${GREEN}✅ Production deployment triggered!${NC}"
echo ""
echo "🔍 Monitor progress at:"
echo "https://github.com/michael-abdo/locumtruerate-app/actions"
echo ""
echo "📍 Production will be live at:"
echo "https://locumtruerate-66ba3177c382.herokuapp.com"
echo ""
echo "🔄 Switching back to vanilla-only branch..."
git checkout vanilla-only