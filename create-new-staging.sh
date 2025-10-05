#!/bin/bash

# Script to create new Heroku staging app with clean name
# This resolves the Chrome phishing warning issue

echo "🚀 Creating new Heroku staging app..."

# Step 1: Create new app
APP_NAME="locumcalc-stage"
echo "Creating app: $APP_NAME"
heroku create $APP_NAME --remote staging-new || {
    # If name is taken, try with year suffix
    APP_NAME="locumcalc-stage-2025"
    echo "First name taken, trying: $APP_NAME"
    heroku create $APP_NAME --remote staging-new
}

# Step 2: Get environment variables from old app
echo "📋 Copying environment variables from old staging app..."
OLD_APP="locumcalc-staging-66ba3177c382"

# Get config vars (excluding Heroku-specific ones)
heroku config --app $OLD_APP --shell | grep -v "^HEROKU_" > old_config.env

# Set config vars on new app
if [ -f old_config.env ]; then
    while IFS='=' read -r key value; do
        # Remove quotes from value if present
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        echo "Setting $key"
        heroku config:set "$key=$value" --app $APP_NAME
    done < old_config.env
    rm old_config.env
fi

# Step 3: Enable HTTPS enforcement
echo "🔒 Enabling HTTPS enforcement..."
heroku config:set FORCE_HTTPS=1 --app $APP_NAME

# Step 4: Set buildpack
echo "📦 Setting buildpack..."
heroku buildpacks:set heroku/nodejs --app $APP_NAME
heroku buildpacks:add --index 1 heroku-community/static --app $APP_NAME

# Step 5: Deploy current code
echo "🚢 Deploying current mobile branch..."
git push staging-new mobile:main

echo "✅ New staging app created!"
echo "📍 New URL: https://${APP_NAME}.herokuapp.com"
echo ""
echo "Next steps:"
echo "1. Test the new URL to ensure no Chrome warnings"
echo "2. Update GitHub Actions to use the new app name"
echo "3. Update any documentation with the new URL"