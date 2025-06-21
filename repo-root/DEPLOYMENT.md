# LocumTrueRate Deployment Guide

## One-Click Deployment

The LocumTrueRate project now includes a comprehensive one-click deployment script that handles the entire deployment process automatically.

### Quick Start

```bash
# Deploy to staging (default)
npm run deploy

# Deploy to production
npm run deploy:production

# Deploy to staging explicitly
npm run deploy:staging
```

### Prerequisites

1. **Environment Variables**: Set the required Cloudflare credentials:
   ```bash
   export CLOUDFLARE_API_TOKEN="your-cloudflare-api-token"
   export CLOUDFLARE_ACCOUNT_ID="your-cloudflare-account-id"
   ```

2. **Tools**: The script will automatically check for and install required tools:
   - Node.js
   - pnpm
   - git
   - wrangler (installed automatically if missing)

### What the Script Does

The one-click deployment script (`scripts/one-click-deploy.sh`) performs the following steps:

#### 1. Pre-flight Checks ✈️
- Validates required tools are installed
- Checks environment variables are set
- Verifies git status and current branch
- Validates Cloudflare configuration files
- Runs Cloudflare setup validation

#### 2. Build Process 🏗️
- Installs dependencies with `pnpm install --frozen-lockfile`
- Runs tests (production only)
- Executes linting and type checking (production only)
- Builds all packages with `pnpm turbo run build`
- Verifies build output

#### 3. Security Validation 🛡️
- Runs security scanner (if available)
- Validates secrets configuration
- Checks for exposed secrets in code
- Ensures HTTPS configuration for production

#### 4. Deployment 🚀
- Detects correct configuration file for environment
- Checks if Cloudflare Pages project exists
- Deploys using custom deployment tool or wrangler
- Provides real-time status updates

#### 5. Post-Deployment Verification ✅
- Waits for deployment to propagate
- Checks site accessibility
- Verifies security headers
- Generates deployment report

#### 6. Cleanup Recommendations 🧹
- Lists unnecessary files that can be removed
- Suggests cleanup commands

### Configuration Files

The deployment uses environment-specific configuration files:

- **Production**: `cloudflare-pages.config.json`
- **Staging**: `cloudflare-pages.staging.json`
- **Development**: `cloudflare-pages.development.json`

### Deployment URLs

- **Production**: https://locumtruerate.com
- **Staging**: https://staging.locumtruerate.com
- **Development**: https://development.locumtruerate.com

### Script Features

#### Error Handling
- Comprehensive error handling with line-by-line error reporting
- Automatic cleanup on failure
- Detailed logging to timestamped files

#### Logging
- Color-coded console output
- Detailed logs saved to `deployment_[env]_[timestamp].log`
- Deployment reports saved to `deployment_report_[env]_[timestamp].txt`

#### Safety Features
- Production deployment confirmation prompt
- Git status checks with override option
- Dry-run capability for testing

### Advanced Usage

#### Environment Variables
Set additional environment variables for customization:
```bash
export NODE_ENV=production
export NEXT_PUBLIC_APP_ENV=production
export LOG_LEVEL=info
```

#### Dry Run
Test deployment without actually deploying:
```bash
npm run deploy:dry-run
```

#### Direct Script Usage
```bash
# Staging deployment
./scripts/one-click-deploy.sh staging

# Production deployment
./scripts/one-click-deploy.sh production
```

### Troubleshooting

#### Common Issues

1. **Missing Environment Variables**
   ```bash
   Error: Missing required environment variables: CLOUDFLARE_API_TOKEN
   ```
   **Solution**: Set the required environment variables as shown above.

2. **Build Failures**
   ```bash
   Error: Build failed. Check log for details.
   ```
   **Solution**: Check the deployment log file for specific build errors.

3. **Deployment Timeout**
   ```bash
   Warning: Site accessibility check failed. It may still be propagating.
   ```
   **Solution**: Wait a few more minutes and check the site manually.

#### Getting Help

1. **Check the logs**: Deployment logs contain detailed error information
2. **Run validation**: `node scripts/validate-cloudflare-setup.js`
3. **Test configuration**: `npm run deploy:dry-run`

### Legacy Scripts

The following legacy scripts are still available but deprecated:
- `npm run deploy:production:legacy` - Old production deployment
- `npm run deploy:staging:legacy` - Old staging deployment

### Cleanup

To clean up unnecessary deployment files:
```bash
# Remove backup duplicates
rm -rf .backup-duplicates/

# Remove old logs (>7 days)
find . -name 'deployment_*.log' -mtime +7 -delete

# Remove old reports (>30 days)
find . -name 'deployment_report_*.txt' -mtime +30 -delete
```

### Security

The deployment script includes several security features:
- ✅ Content Security Policy (CSP) headers
- ✅ HTTP Strict Transport Security (HSTS) for production
- ✅ X-Frame-Options protection
- ✅ Secrets validation
- ✅ Hardcoded secrets detection
- ✅ HTTPS enforcement for production

### Monitoring

After deployment, monitor:
- Site accessibility and performance
- Error logs and exception tracking
- Security headers and SSL certificates
- Analytics and user metrics

### Support

For deployment issues:
1. Check the deployment log files
2. Review the configuration files
3. Validate Cloudflare setup
4. Test with dry-run mode
5. Consult the full deployment guide in `docs/deployment-guide.md`

---

**Note**: This one-click deployment script replaces the need for manual deployment steps and provides a streamlined, reliable deployment process with comprehensive error handling and validation.