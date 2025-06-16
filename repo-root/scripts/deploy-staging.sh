#!/bin/bash

# LocumTrueRate Staging Deployment Script
# Deploys to staging environment for testing

set -e

echo "🧪 Starting LocumTrueRate Staging Deployment..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Run tests (skip slow integration tests in staging)
print_status "Running core tests..."
pnpm turbo run test --filter=!mobile --filter=!integration

# Build packages
print_status "Building packages..."
pnpm turbo run build --filter=!mobile

# Deploy to staging
print_status "Deploying to Cloudflare Pages (staging)..."
node packages/cloudflare-pages/bin/deploy.js deploy --config cloudflare-pages.staging.json

print_success "Staging deployment completed!"

echo ""
echo "🎭 Staging site: https://staging.locumtruerate.com"
echo "📝 Test all features before promoting to production"
echo ""