# Heroku Multi-Environment Setup Guide

## Creating Preview/Staging Environment on Heroku

Since you're already using Heroku, let's set up a proper staging environment alongside your production app.

### Step 1: Create Staging App
```bash
# Create a new Heroku app for staging
heroku create locumtruerate-staging

# You now have:
# Production: locumtruerate-demo-2e641e257df4.herokuapp.com
# Staging: locumtruerate-staging.herokuapp.com
```

### Step 2: Set Up Heroku Pipeline
```bash
# Create a pipeline
heroku pipelines:create locumtruerate -a locumtruerate-demo -s production

# Add staging app to pipeline
heroku pipelines:add locumtruerate -a locumtruerate-staging -s staging
```

### Step 3: Configure Git Remotes
```bash
# Add staging remote
git remote add staging https://git.heroku.com/locumtruerate-staging.git

# Add production remote (if not already present)
git remote add production https://git.heroku.com/locumtruerate-demo.git

# Verify remotes
git remote -v
```

### Step 4: Environment-Specific Config
```bash
# Set staging environment variables
heroku config:set NODE_ENV=staging -a locumtruerate-staging
heroku config:set NEXT_PUBLIC_APP_ENV=staging -a locumtruerate-staging
heroku config:set NEXT_PUBLIC_SHOW_PREVIEW_BANNER=true -a locumtruerate-staging

# Copy production config to staging
heroku config -a locumtruerate-demo -s | heroku config:set -a locumtruerate-staging

# Modify staging-specific vars
heroku config:set DATABASE_URL=your-staging-database-url -a locumtruerate-staging
```

### Step 5: Deploy to Different Environments

#### Deploy to Staging:
```bash
# From preview-deployment branch
git push staging preview-deployment:main
```

#### Deploy to Production:
```bash
# From main/master branch
git push production main:main
```

### Step 6: Branching Strategy

```
main (production)
├── staging (staging environment)
├── preview-deployment (current preview branch)
└── feature/* (feature branches)
```

### Workflow Example:
1. Work on `feature/new-calculator`
2. Deploy to staging: `git push staging feature/new-calculator:main`
3. Test on staging URL
4. Merge to main
5. Deploy to production: `git push production main:main`

### Step 7: Add Review Apps (Optional)
```bash
# Enable review apps in pipeline
heroku reviewapps:enable -p locumtruerate

# Configure in app.json (already created)
```

### Quick Deploy Commands

Create these git aliases for easy deployment:
```bash
# Add to ~/.gitconfig or run these commands
git config --global alias.deploy-staging '!git push staging HEAD:main'
git config --global alias.deploy-prod '!git push production main:main'

# Usage:
git deploy-staging  # Deploy current branch to staging
git deploy-prod     # Deploy main to production
```

### Environment URLs:
- **Production**: https://locumtruerate-demo-2e641e257df4.herokuapp.com
- **Staging**: https://locumtruerate-staging.herokuapp.com
- **Review Apps**: https://locumtruerate-pr-{number}.herokuapp.com

### Cost:
- Each Heroku app needs its own dyno
- Eco dynos: $5/month each
- Total for staging + production: $10/month
- Review apps: Prorated hourly

## Alternative: Single App with Different Slugs

If you want to save costs, you can use Heroku's release phase to deploy different versions:

```bash
# Deploy specific release to production
heroku releases:rollback v18 -a locumtruerate-demo

# Or create a new release from a specific commit
heroku builds:create --source-tar https://github.com/your-repo/archive/commit-hash.tar.gz -a locumtruerate-demo
```

## Recommendation

For your needs, I recommend:
1. **Create the staging app** (locumtruerate-staging)
2. **Use git remotes** for easy deployment
3. **Keep June 27 v18 on production**
4. **Test new changes on staging first**

This gives you the safety to experiment without breaking your stable production deployment!