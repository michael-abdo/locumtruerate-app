#!/bin/bash

# Universal Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REPO="michael-abdo/locumtruerate-app"
STAGING_APP="locumtruerate-staging"
STAGING_URL="https://locumtruerate-staging-66ba3177c382.herokuapp.com"
PRODUCTION_APP="locumtruerate-demo-2e641e257df4"
PRODUCTION_URL="https://locumtruerate-demo-2e641e257df4.herokuapp.com"

# Function to show usage
show_usage() {
    echo "Usage: $0 [staging|production]"
    echo ""
    echo "Examples:"
    echo "  $0 staging      # Deploy to staging"
    echo "  $0 production   # Deploy to production"
    echo ""
    exit 1
}

# Function to deploy via GitHub Actions (branch trigger)
deploy_via_github_actions() {
    local env=$1
    local branch_name="${env}-deploy"
    
    echo -e "${BLUE}🚀 Deploying via GitHub Actions...${NC}"
    
    # Create and push deployment branch
    echo "Creating ${branch_name} branch..."
    git checkout -b ${branch_name} 2>/dev/null || git checkout ${branch_name}
    git reset --hard vanilla-only
    git push origin ${branch_name} --force
    
    echo -e "${GREEN}✅ Deployment triggered!${NC}"
    echo ""
    echo "🔍 Monitor progress:"
    echo "https://github.com/${REPO}/actions"
    
    # Switch back to vanilla-only
    git checkout vanilla-only
}

# Function to deploy directly via Heroku (if API key available)
deploy_direct() {
    local env=$1
    local app_name=$2
    local app_url=$3
    
    echo -e "${BLUE}🚀 Deploying directly to Heroku...${NC}"
    
    if [ -z "$HEROKU_API_KEY" ]; then
        echo -e "${RED}❌ HEROKU_API_KEY not set${NC}"
        echo "Falling back to GitHub Actions method..."
        deploy_via_github_actions $env
        return
    fi
    
    # Set up Heroku authentication
    cat > ~/.netrc <<EOF
machine api.heroku.com
  login zenex3298@gmail.com
  password $HEROKU_API_KEY
machine git.heroku.com
  login zenex3298@gmail.com
  password $HEROKU_API_KEY
EOF
    chmod 600 ~/.netrc
    
    # Install Heroku CLI if needed
    if ! command -v heroku &> /dev/null; then
        echo "Installing Heroku CLI..."
        curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
        export PATH="/usr/local/bin:$PATH"
    fi
    
    # Create app if it doesn't exist (for production)
    if [ "$env" = "production" ]; then
        echo "Creating/verifying production app..."
        heroku create $app_name --region us || echo "App already exists"
        heroku config:set NODE_ENV=production -a $app_name
        heroku config:set APP_NAME="LocumTrueRate Production" -a $app_name
    fi
    
    # Set up git remote and deploy
    git remote remove heroku-${env} 2>/dev/null || true
    git remote add heroku-${env} https://git.heroku.com/${app_name}.git
    
    echo "Deploying to ${env}..."
    git push heroku-${env} vanilla-only:main --force
    
    # Verify deployment
    echo "Verifying deployment..."
    sleep 45
    
    if curl -s -f ${app_url}/health > /dev/null; then
        echo -e "${GREEN}✅ ${env} deployment successful!${NC}"
    else
        echo -e "${YELLOW}⚠️  App may still be starting...${NC}"
    fi
}

# Main script
main() {
    local environment=$1
    
    # Validate input
    if [ -z "$environment" ]; then
        echo -e "${RED}❌ Error: Environment required${NC}"
        show_usage
    fi
    
    case $environment in
        staging)
            APP_NAME=$STAGING_APP
            APP_URL=$STAGING_URL
            CONFIRMATION_REQUIRED=false
            ;;
        production)
            APP_NAME=$PRODUCTION_APP
            APP_URL=$PRODUCTION_URL
            CONFIRMATION_REQUIRED=true
            ;;
        *)
            echo -e "${RED}❌ Error: Invalid environment '$environment'${NC}"
            echo "Valid options: staging, production"
            show_usage
            ;;
    esac
    
    echo -e "${BLUE}🚀 DEPLOYMENT TO ${environment^^}${NC}"
    echo "================================="
    echo ""
    echo "📍 Target URL: $APP_URL"
    echo "📦 App Name: $APP_NAME"
    echo "🌿 Branch: $(git branch --show-current)"
    echo "📝 Latest commit: $(git log --oneline -1)"
    echo ""
    
    # Confirmation for production
    if [ "$CONFIRMATION_REQUIRED" = true ]; then
        echo -e "${YELLOW}⚠️  WARNING: Deploying to PRODUCTION!${NC}"
        echo ""
        read -p "Type '${environment^^}' to confirm: " confirm
        
        if [ "$confirm" != "${environment^^}" ]; then
            echo -e "${RED}❌ Deployment cancelled${NC}"
            exit 1
        fi
        echo ""
    fi
    
    # Choose deployment method
    if [ -n "$HEROKU_API_KEY" ]; then
        echo "🔑 HEROKU_API_KEY found - using direct deployment"
        deploy_direct $environment $APP_NAME $APP_URL
    else
        echo "🔀 Using GitHub Actions deployment method"
        deploy_via_github_actions $environment
    fi
    
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
    echo ""
    echo -e "${BLUE}📍 Your URLs:${NC}"
    echo "🔄 Staging:    $STAGING_URL"
    echo "🌟 Production: $PRODUCTION_URL"
}

# Run main function with all arguments
main "$@"