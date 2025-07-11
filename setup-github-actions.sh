#!/bin/bash

echo "=== GitHub Actions Setup for Automatic Deployments ==="
echo ""
echo "This script will help you set up automatic deployments to solve the commit/deployment mismatch problem."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}STEP 1: Add GitHub Secret${NC}"
echo "1. Go to: https://github.com/[YOUR-REPO]/settings/secrets/actions/new"
echo "2. Add a new secret:"
echo "   Name: HEROKU_API_KEY"
echo "   Value: HRKU-AATyvznaTNma968q-Xprusosqmi2nORKWqQCrDAtMl5w_____whu5gqIrE-L"
echo ""
echo "Press Enter when complete..."
read

echo -e "${YELLOW}STEP 2: Verify Workflows${NC}"
echo "The following workflows have been created:"
echo -e "${GREEN}✓${NC} .github/workflows/deploy-staging.yml - Auto-deploy to staging on push"
echo -e "${GREEN}✓${NC} .github/workflows/deploy-production.yml - Deploy to production on tags"
echo -e "${GREEN}✓${NC} .github/workflows/pr-preview.yml - Preview deployments for PRs"
echo ""

echo -e "${YELLOW}STEP 3: How It Works${NC}"
echo "From now on:"
echo "• Every push to main → Automatically deploys to STAGING"
echo "• Creating a version tag (v1.0.0) → Automatically deploys to PRODUCTION"
echo "• Opening a PR → Creates a preview deployment"
echo ""

echo -e "${YELLOW}STEP 4: Your New Workflow${NC}"
echo "1. Make changes locally"
echo "2. git add . && git commit -m 'Your message'"
echo "3. git push → Automatically deploys to staging"
echo "4. Test on https://locumtruerate-staging-66ba3177c382.herokuapp.com"
echo "5. When ready: git tag -a v1.0.0 -m 'Release' && git push origin v1.0.0"
echo "6. Automatically deploys to production!"
echo ""

echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Your deployments will now automatically match your commits."
echo "No more manual deployments needed!"