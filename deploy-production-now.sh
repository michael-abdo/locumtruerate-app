#!/bin/bash

# Programmatic Production Deployment Script
# This creates and deploys to production directly

echo "🚀 PRODUCTION DEPLOYMENT STARTING"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  WARNING: Deploying to PRODUCTION!${NC}"
echo "Target: https://locumtruerate-66ba3177c382.herokuapp.com"
echo ""

# Show what we're deploying
echo -e "${BLUE}📋 Current state:${NC}"
echo "Branch: $(git branch --show-current)"
echo "Latest commit: $(git log --oneline -1)"
echo ""

# Confirm deployment
echo -e "${YELLOW}Type 'PRODUCTION' to confirm deployment:${NC}"
read -p "> " confirm

if [ "$confirm" != "PRODUCTION" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🚀 Starting production deployment...${NC}"

# Set up authentication (using the same pattern as GitHub Actions)
echo "Setting up Heroku authentication..."
cat > ~/.netrc <<EOF
machine api.heroku.com
  login zenex3298@gmail.com
  password $HEROKU_API_KEY
machine git.heroku.com
  login zenex3298@gmail.com
  password $HEROKU_API_KEY
EOF
chmod 600 ~/.netrc

# Install Heroku CLI if not available
if ! command -v heroku &> /dev/null; then
    echo "Installing Heroku CLI..."
    curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
    export PATH="/usr/local/bin:$PATH"
fi

# Create production app (will skip if exists)
echo ""
echo -e "${BLUE}📦 Creating/verifying production app...${NC}"
heroku create locumtruerate-66ba3177c382 --region us || echo "App already exists, continuing..."

# Configure production environment
echo "Setting production environment variables..."
heroku config:set NODE_ENV=production -a locumtruerate-66ba3177c382
heroku config:set APP_NAME="LocumTrueRate Production" -a locumtruerate-66ba3177c382

# Add production remote
echo "Setting up git remote..."
git remote remove heroku-prod 2>/dev/null || true
git remote add heroku-prod https://git.heroku.com/locumtruerate-66ba3177c382.git

# Deploy to production
echo ""
echo -e "${GREEN}🚀 Deploying to production...${NC}"
git push heroku-prod vanilla-only:main --force

# Verify deployment
echo ""
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
echo "Waiting for app to start..."
sleep 60

echo "Testing production URL..."
if curl -s -f https://locumtruerate-66ba3177c382.herokuapp.com/ > /dev/null; then
    echo -e "${GREEN}✅ Production app is responding!${NC}"
else
    echo -e "${YELLOW}⚠️  App may still be starting up...${NC}"
fi

# Test health endpoint
echo "Checking health endpoint..."
HEALTH_RESPONSE=$(curl -s https://locumtruerate-66ba3177c382.herokuapp.com/health || echo "No health endpoint")
echo "Health response: $HEALTH_RESPONSE"

echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo "🔄 Staging:    https://locumtruerate-staging-66ba3177c382.herokuapp.com"
echo "🌟 Production: https://locumtruerate-66ba3177c382.herokuapp.com"
echo ""
echo -e "${GREEN}✅ Your two-URL architecture is now live!${NC}"