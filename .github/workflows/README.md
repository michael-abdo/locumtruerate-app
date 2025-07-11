# GitHub Actions Deployment Workflows

This directory contains automated deployment workflows that solve the commit/deployment mismatch problem by automatically deploying your code when you push changes.

## Workflow Overview

### 1. Staging Deployment (`deploy-staging.yml`)
- **Triggers**: Every push to `main`, `master`, or `develop` branches
- **Deploys to**: https://locumtruerate-staging-66ba3177c382.herokuapp.com
- **Purpose**: Automatically test all changes before production

### 2. Production Deployment (`deploy-production.yml`)
- **Triggers**: 
  - Creating version tags (e.g., `v1.0.0`)
  - Manual trigger with confirmation
- **Deploys to**: https://locumtruerate-demo.herokuapp.com
- **Purpose**: Controlled production releases

### 3. PR Preview Deployments (`pr-preview.yml`)
- **Triggers**: Opening or updating pull requests
- **Creates**: Temporary preview app for each PR
- **Purpose**: Review changes before merging

## Setup Required

### 1. Add GitHub Secret
Go to your repository settings → Secrets → Actions and add:
- **Name**: `HEROKU_API_KEY`
- **Value**: `HRKU-AATyvznaTNma968q-Xprusosqmi2nORKWqQCrDAtMl5w_____whu5gqIrE-L`

### 2. Deployment Flow

```
Developer Push → GitHub → Staging (Automatic) → Testing → Production (Manual/Tag)
```

## How It Works

### Automatic Staging Deployment
Every time you push to main:
```bash
git add .
git commit -m "Add new feature"
git push origin main
# → Automatically deploys to staging
```

### Production Deployment (Option 1: Tags)
When ready for production:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
# → Automatically deploys to production
```

### Production Deployment (Option 2: Manual)
1. Go to Actions tab in GitHub
2. Select "Deploy to Production"
3. Click "Run workflow"
4. Type "DEPLOY" to confirm
5. Click "Run workflow"

### PR Preview Deployments
1. Create a pull request
2. Bot comments with preview URL
3. Preview updates with each commit
4. App deleted when PR is closed

## Benefits

1. **No More Mismatches**: Every commit is deployed automatically
2. **Safe Defaults**: All changes go to staging first
3. **Easy Rollback**: Tag-based deployments make rollback simple
4. **Preview Changes**: See PR changes before merging
5. **Audit Trail**: GitHub Actions logs show all deployments

## Monitoring Deployments

- **GitHub Actions Tab**: See all deployment runs
- **Deployment Status**: Green check = success, Red X = failure
- **Logs**: Click any workflow run to see detailed logs

## Troubleshooting

### If deployment fails:
1. Check GitHub Actions logs
2. Ensure `HEROKU_API_KEY` secret is set correctly
3. Verify Heroku app names match
4. Check Heroku app logs: `heroku logs --tail -a app-name`

### To skip deployment:
Add `[skip ci]` to your commit message:
```bash
git commit -m "Update README [skip ci]"
```

## Best Practices

1. **Always let staging deploy first** before promoting to production
2. **Use semantic versioning** for tags (v1.0.0, v1.0.1, v1.1.0)
3. **Test on staging** before creating production tags
4. **Monitor deployments** through GitHub Actions tab
5. **Document releases** in tag messages

This setup ensures your deployments always match your commits!