# GitHub Actions Setup

## Required Secrets

Add these secrets in your GitHub repository settings (`Settings > Secrets and variables > Actions`):

### Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `HEROKU_API_KEY` | Your Heroku API key for authentication | `your-heroku-api-key` |
| `HEROKU_STAGING_APP_NAME` | Name of the staging Heroku app | `locumtruerate-stage` |

### How to Set Up

1. **Get your Heroku API Key:**
   ```bash
   heroku auth:token
   ```

2. **Add secrets to GitHub:**
   - Go to your repository on GitHub
   - Navigate to `Settings > Secrets and variables > Actions`
   - Click "New repository secret"
   - Add each secret from the table above

### App Names

- **Staging:** The app name specified in `HEROKU_STAGING_APP_NAME` secret
- **Production:** `locumtruerate-demo-2e641e257df4` (hardcoded in workflow)

### Deployment URLs

- **Staging:** `https://[HEROKU_STAGING_APP_NAME].herokuapp.com`
- **Production:** `https://locumtruerate-demo-2e641e257df4.herokuapp.com`

## Creating New Staging App

To create a new staging app and avoid Chrome security warnings:

1. Run the provided script:
   ```bash
   ./create-new-staging.sh
   ```

2. Update the `HEROKU_STAGING_APP_NAME` GitHub secret with the new app name

3. The workflow will automatically use the new app name for future deployments