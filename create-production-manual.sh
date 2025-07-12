#!/bin/bash

# Manual Production App Creation Script
# This bypasses GitHub Actions if needed

echo "🚀 Manual Production App Creation"
echo "================================="

# Note: This requires HEROKU_API_KEY environment variable
if [ -z "$HEROKU_API_KEY" ]; then
    echo "❌ HEROKU_API_KEY environment variable not set"
    echo "You need to get this from your GitHub Secrets or Heroku dashboard"
    exit 1
fi

APP_NAME="locumtruerate-66ba3177c382"

echo "Creating app: $APP_NAME"

# Create app via API
curl -X POST https://api.heroku.com/apps \
  -H "Accept: application/vnd.heroku+json; version=3" \
  -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$APP_NAME\",\"region\":\"us\"}"

echo ""
echo "Setting production config..."

# Set NODE_ENV
curl -X PATCH https://api.heroku.com/apps/$APP_NAME/config-vars \
  -H "Accept: application/vnd.heroku+json; version=3" \
  -H "Authorization: Bearer $HEROKU_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"NODE_ENV":"production"}'

echo ""
echo "✅ Production app created!"
echo "URL: https://$APP_NAME.herokuapp.com"
echo ""
echo "Now you can deploy with:"
echo "git push heroku-prod vanilla-only:main --force"