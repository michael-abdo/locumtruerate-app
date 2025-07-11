#!/bin/bash

echo "🚀 Deploying Vanilla Demos to Heroku Staging..."

# Source Heroku API key
source /home/Mike/devops/credentials/heroku-api-key.env

# Create a temporary git repo for deployment
rm -rf /tmp/heroku-deploy
cp -r . /tmp/heroku-deploy
cd /tmp/heroku-deploy

# Initialize git
git init
git add -A
git commit -m "Deploy vanilla demos"

# Add Heroku remote with authentication
git remote add heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/locumtruerate-staging.git

# Force push to Heroku
git push heroku main --force

echo "✅ Deployment complete! Check: https://locumtruerate-staging-66ba3177c382.herokuapp.com"