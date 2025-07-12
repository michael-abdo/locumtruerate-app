#!/bin/bash

# Trigger Production Deployment via GitHub API
# This bypasses the need for manual clicking

echo "🚀 PROGRAMMATIC PRODUCTION DEPLOYMENT"
echo "===================================="
echo ""

# Check if we have a GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable not set"
    echo ""
    echo "To get a GitHub token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Create a token with 'Actions' permission"
    echo "3. Run: GITHUB_TOKEN=your_token ./trigger-production-deployment.sh"
    echo ""
    echo "Alternatively, you can run the deployment manually via the web interface."
    exit 1
fi

echo "📋 Deployment Details:"
echo "Repository: michael-abdo/locumtruerate-app"
echo "Workflow: Deploy to Heroku Staging (with production option)"
echo "Branch: vanilla-only"
echo "Target: https://locumtruerate-66ba3177c382.herokuapp.com"
echo ""

echo "⚠️  WARNING: This will deploy to PRODUCTION!"
echo ""
read -p "Type 'DEPLOY' to confirm: " confirm

if [ "$confirm" != "DEPLOY" ]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo ""
echo "🚀 Triggering production deployment via GitHub API..."

# Trigger the workflow via GitHub API
curl -X POST \
  -H "Accept: application/vnd.github.v3+json" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/michael-abdo/locumtruerate-app/actions/workflows/deploy-staging.yml/dispatches \
  -d '{
    "ref": "vanilla-only",
    "inputs": {
      "environment": "production",
      "confirm": "DEPLOY"
    }
  }'

echo ""
echo "✅ Production deployment triggered!"
echo ""
echo "🔍 Monitor progress at:"
echo "https://github.com/michael-abdo/locumtruerate-app/actions"
echo ""
echo "📍 Production will be live at:"
echo "https://locumtruerate-66ba3177c382.herokuapp.com"