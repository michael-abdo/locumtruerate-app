#!/bin/bash

# LocumTrueRate Production Deployment Script
# Deploys to Cloudflare Pages with full security validation

set -e  # Exit on any error

echo "🚀 Starting LocumTrueRate Production Deployment..."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm first."
    exit 1
fi

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Installing..."
    npm install -g wrangler
fi

# Check required environment variables
required_env_vars=("CLOUDFLARE_API_TOKEN" "CLOUDFLARE_ACCOUNT_ID")
for var in "${required_env_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set"
        exit 1
    fi
done

print_success "Prerequisites check passed"

# Validate secrets
print_status "Validating secrets configuration..."
if [ -f "packages/secrets/dist/cli.js" ]; then
    node packages/secrets/dist/cli.js validate --env production
else
    print_warning "Secrets validation skipped (package not built)"
fi

# Security validation
print_status "Running security validation..."
node packages/cloudflare-pages/bin/security.js --config cloudflare-pages.config.json

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile

# Run tests
print_status "Running tests..."
pnpm turbo run test --filter=!mobile

# Run linting and type checking
print_status "Running code quality checks..."
pnpm turbo run lint
pnpm turbo run type-check

# Build all packages
print_status "Building packages..."
pnpm turbo run build --filter=!mobile

# Security scan
print_status "Running security scan..."
if [ -f "packages/security/dist/scanner.js" ]; then
    node packages/security/dist/scanner.js --target apps/web/out
else
    print_warning "Security scan skipped (package not built)"
fi

# Generate security files
print_status "Generating security files..."
node packages/cloudflare-pages/bin/deploy.js --dry-run --config cloudflare-pages.config.json

# Deploy to Cloudflare Pages
print_status "Deploying to Cloudflare Pages..."
node packages/cloudflare-pages/bin/deploy.js deploy --config cloudflare-pages.config.json

print_success "Production deployment completed successfully!"

# Post-deployment checks
print_status "Running post-deployment verification..."
sleep 30  # Wait for deployment to propagate

# Check if site is accessible
SITE_URL="https://locumtruerate.com"
if curl -s --head "$SITE_URL" | head -n 1 | grep -q "200 OK"; then
    print_success "Site is accessible at $SITE_URL"
else
    print_warning "Site accessibility check failed"
fi

# Check security headers
print_status "Verifying security headers..."
HEADERS_CHECK=$(curl -s -I "$SITE_URL" | grep -E "(content-security-policy|x-frame-options|strict-transport-security)" | wc -l)
if [ "$HEADERS_CHECK" -ge 2 ]; then
    print_success "Security headers are present"
else
    print_warning "Some security headers may be missing"
fi

print_success "Deployment verification completed!"

echo ""
echo "🎉 LocumTrueRate is now live at: $SITE_URL"
echo ""
echo "📊 Next steps:"
echo "  1. Monitor deployment metrics"
echo "  2. Verify all features work correctly"
echo "  3. Update DNS records if needed"
echo "  4. Set up monitoring alerts"
echo ""