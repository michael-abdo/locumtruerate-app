# LocumTrueRate Deployment Guide

## Overview

We use a two-stage deployment process:
- **Staging**: Auto-deploys from `vanilla-only` branch
- **Production**: Manual deployment with confirmation

## URLs

- **Staging**: https://locumtruerate-staging-66ba3177c382.herokuapp.com
- **Production**: https://locumtruerate-production.herokuapp.com (to be created)

## Deployment Flow

```
Feature Branch → vanilla-only → Staging (Auto)
                      ↓
                    main → Production (Manual)
```

## How to Deploy

### To Staging (Automatic)
```bash
git push origin vanilla-only
```
This triggers GitHub Actions to auto-deploy to staging.

### To Production (Manual)

#### Option 1: Command Line
```bash
./deploy-to-production.sh
```

#### Option 2: GitHub Actions
1. Go to Actions tab in GitHub
2. Select "Deploy to Heroku Production"
3. Click "Run workflow"
4. Type "deploy" to confirm
5. Click "Run workflow"

#### Option 3: Direct Git Push
```bash
# First, merge vanilla-only to main
git checkout main
git merge vanilla-only
git push origin main

# Then push to production
git push heroku-prod main:main --force
```

## Environment Variables

### Staging
- `NODE_ENV=staging`
- Auto-set by GitHub Actions

### Production
- `NODE_ENV=production`
- Set in Heroku dashboard

## Rollback Procedure

### Quick Rollback
```bash
# View recent releases
heroku releases -a locumtruerate-production

# Rollback to previous version
heroku rollback -a locumtruerate-production
```

### Git-based Rollback
```bash
# Find the commit you want
git log --oneline

# Deploy specific commit
git push heroku-prod <commit-hash>:main --force
```

## Best Practices

1. **Always test on staging first**
2. **Review changes before production deployment**
3. **Tag production releases**:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
4. **Monitor after deployment**
5. **Keep production on `main` branch**

## Troubleshooting

### Deployment Failed
1. Check Heroku logs: `heroku logs -a locumtruerate-production`
2. Verify build pack: Should be `heroku/nodejs`
3. Check `package.json` for correct Node version

### Wrong Version Deployed
1. Clear build cache: `heroku builds:cache:purge -a locumtruerate-production`
2. Force push again: `git push heroku-prod main:main --force`

## Next Steps

1. Create production Heroku app:
   ```bash
   heroku create locumtruerate-production
   ```

2. Configure production app:
   ```bash
   heroku config:set NODE_ENV=production -a locumtruerate-production
   ```

3. Set up custom domain (optional):
   ```bash
   heroku domains:add www.locumtruerate.com -a locumtruerate-production
   ```