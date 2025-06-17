#!/bin/bash

# Job Board Deployment Script
# This script helps deploy the job board to Cloudflare Workers

echo "🚀 Job Board Deployment Script"
echo "================================"

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Wrangler CLI is not installed."
        echo "📦 Installing Wrangler..."
        npm install -g wrangler
    fi
    
    echo "✅ Dependencies checked"
}

# Setup KV namespaces
setup_kv() {
    echo "🗄️  Setting up KV namespaces..."
    
    # Create JOBS namespace
    echo "Creating JOBS KV namespace..."
    JOBS_KV=$(wrangler kv:namespace create "JOBS" 2>/dev/null | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$JOBS_KV" ]; then
        echo "✅ JOBS KV namespace created: $JOBS_KV"
    else
        echo "⚠️  JOBS KV namespace might already exist or failed to create"
    fi
    
    # Create JOBS preview namespace
    echo "Creating JOBS preview KV namespace..."
    JOBS_PREVIEW_KV=$(wrangler kv:namespace create "JOBS" --preview 2>/dev/null | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
    
    # Create APPLICATIONS namespace
    echo "Creating APPLICATIONS KV namespace..."
    APPS_KV=$(wrangler kv:namespace create "APPLICATIONS" 2>/dev/null | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$APPS_KV" ]; then
        echo "✅ APPLICATIONS KV namespace created: $APPS_KV"
    else
        echo "⚠️  APPLICATIONS KV namespace might already exist or failed to create"
    fi
    
    # Create APPLICATIONS preview namespace
    echo "Creating APPLICATIONS preview KV namespace..."
    APPS_PREVIEW_KV=$(wrangler kv:namespace create "APPLICATIONS" --preview 2>/dev/null | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
    
    echo "📝 Please update your wrangler.toml file with these KV namespace IDs:"
    echo "   JOBS: $JOBS_KV (preview: $JOBS_PREVIEW_KV)"
    echo "   APPLICATIONS: $APPS_KV (preview: $APPS_PREVIEW_KV)"
    echo ""
}

# Build and deploy
deploy() {
    echo "🔨 Building and deploying..."
    
    # Install dependencies
    echo "📦 Installing dependencies..."
    npm install
    
    # Deploy to Cloudflare Workers
    echo "🚀 Deploying to Cloudflare Workers..."
    wrangler publish
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 Your job board is now live!"
    else
        echo "❌ Deployment failed. Please check the error messages above."
        exit 1
    fi
}

# Main deployment flow
main() {
    check_dependencies
    
    echo ""
    read -p "🔑 Have you configured your Cloudflare API token? (y/n): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "📖 Please configure your Cloudflare API token first:"
        echo "   1. Go to https://dash.cloudflare.com/profile/api-tokens"
        echo "   2. Create a token with 'Cloudflare Workers:Edit' permissions"
        echo "   3. Run: wrangler auth"
        echo "   4. Or set CLOUDFLARE_API_TOKEN environment variable"
        exit 1
    fi
    
    echo ""
    read -p "📦 Do you want to set up KV namespaces? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_kv
        echo ""
        read -p "✏️  Have you updated wrangler.toml with the KV namespace IDs? (y/n): " -n 1 -r
        echo ""
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "⚠️  Please update wrangler.toml before continuing deployment."
            exit 1
        fi
    fi
    
    deploy
}

# Run the deployment
main