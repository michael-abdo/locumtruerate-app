#!/bin/bash

echo "=== GitHub Actions Deployment Checker ==="
echo "Current time: $(date)"
echo ""

# Check current branch and commits
echo "📌 Current Git Status:"
git branch --show-current
git log --oneline -5
echo ""

# Check if we're on the right repository
echo "🔗 Repository URL:"
git config --get remote.origin.url
echo ""

# Check latest Heroku release
echo "🚀 Latest Heroku Releases:"
source /home/Mike/devops/credentials/heroku-api-key.env
heroku releases -a locumtruerate-staging | head -5
echo ""

# Check what's actually deployed
echo "🌐 Checking deployed site:"
curl -s https://locumtruerate-staging-66ba3177c382.herokuapp.com | grep -o '<title>.*</title>' | head -1
echo ""

# Instructions for fixing
echo "📋 To fix GitHub Actions deployment:"
echo "1. Go to: https://github.com/michael-abdo/locumtruerate-app/settings/secrets/actions"
echo "2. Add a new secret called HEROKU_API_KEY"
echo "3. Get the API key value from: /home/Mike/devops/credentials/heroku-api-key.env"
echo "4. The key starts with: $(source /home/Mike/devops/credentials/heroku-api-key.env && echo $HEROKU_API_KEY | cut -c1-10)..."
echo ""
echo "5. After adding the secret, push a new commit to trigger deployment"