#!/bin/bash

# Production Deployment Script
# Usage: ./deploy-to-production.sh

echo "🚀 LocumTrueRate Production Deployment"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Show recent commits
echo "📋 Recent commits:"
git log --oneline -5
echo ""

# Confirm deployment
echo -e "${YELLOW}⚠️  WARNING: You are about to deploy to PRODUCTION!${NC}"
echo "This will deploy the current branch ($CURRENT_BRANCH) to production."
echo ""
read -p "Type 'deploy' to confirm: " confirm

if [ "$confirm" != "deploy" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Add production remote if not exists
if ! git remote | grep -q "heroku-prod"; then
    echo "Adding production remote..."
    git remote add heroku-prod https://git.heroku.com/locumtruerate-production.git
fi

# Deploy to production
echo ""
echo -e "${GREEN}🚀 Deploying to production...${NC}"
git push heroku-prod $CURRENT_BRANCH:main --force

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo "Production URL: https://locumtruerate-production.herokuapp.com"
echo ""

# Optional: Open in browser
read -p "Open production site in browser? (y/n): " open_browser
if [ "$open_browser" = "y" ]; then
    open https://locumtruerate-production.herokuapp.com || xdg-open https://locumtruerate-production.herokuapp.com
fi