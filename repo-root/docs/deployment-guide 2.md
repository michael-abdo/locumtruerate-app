# LocumTrueRate Deployment Guide

## Overview

This guide covers deploying LocumTrueRate to Cloudflare Pages with comprehensive security headers, CSP policies, and HIPAA-compliant configuration.

## Prerequisites

### Required Tools
- [pnpm](https://pnpm.io/) - Package manager
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare deployment tool
- Node.js 18+ 

### Required Environment Variables

```bash
# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Database
DATABASE_URL=postgresql://...
ENCRYPTION_MASTER_KEY=your_encryption_key

# Authentication
CLERK_SECRET_KEY=sk_...
JWT_SECRET=your_jwt_secret

# Payments
STRIPE_SECRET_KEY=sk_...

# Email
SENDGRID_API_KEY=SG....

# Monitoring
SENTRY_DSN=https://...
```

## Deployment Environments

### 1. Development
- **URL**: `localhost:3000`
- **Purpose**: Local development and testing
- **Security**: Relaxed CSP, CORS enabled
- **Config**: `cloudflare-pages.development.json`

### 2. Staging
- **URL**: `staging.locumtruerate.com`
- **Purpose**: Pre-production testing
- **Security**: Production-like security with relaxed monitoring
- **Config**: `cloudflare-pages.staging.json`

### 3. Production
- **URL**: `locumtruerate.com`
- **Purpose**: Live production environment
- **Security**: Full HIPAA-compliant security headers
- **Config**: `cloudflare-pages.config.json`

## Deployment Commands

### Quick Deployment

```bash
# Deploy to staging
pnpm deploy:staging

# Deploy to production
pnpm deploy:production

# Deploy specific environment
pnpm cf-pages-deploy deploy --config cloudflare-pages.staging.json
```

### Manual Deployment

```bash
# 1. Install dependencies
pnpm install

# 2. Run tests
pnpm turbo run test

# 3. Build packages
pnpm turbo run build

# 4. Deploy
./scripts/deploy-production.sh
```

## Security Configuration

### Content Security Policy (CSP)

The platform implements a strict CSP that allows:

- **Script sources**: Self, Clerk, Stripe, analytics (conditional)
- **Style sources**: Self, Google Fonts, unsafe-inline for CSS-in-JS
- **Image sources**: Self, CDN, data/blob, Clerk, analytics pixels
- **Connect sources**: API, Clerk, Stripe, analytics, monitoring

### Security Headers

All deployments include:

```
Content-Security-Policy: [strict policy]
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

### HIPAA Compliance Features

- Encrypted secrets management
- Audit logging for all access
- No indexing of sensitive pages
- Secure cookie settings
- Data retention policies

## Build Optimization

### Production Optimizations

- **Minification**: Enabled
- **Tree shaking**: Enabled
- **Code splitting**: Enabled
- **Compression**: Level 9
- **Bundle analysis**: Available

### Performance Features

- **Static asset caching**: 1 year
- **API response caching**: Disabled
- **Image optimization**: Automatic
- **Font optimization**: Preload critical fonts

## Monitoring and Alerts

### Deployment Verification

Each deployment includes:

1. **Pre-deployment checks**
   - Environment variable validation
   - Secret configuration validation
   - Build output verification
   - Security policy validation

2. **Post-deployment verification**
   - Site accessibility check
   - Security header verification
   - API endpoint testing
   - Performance baseline check

### Monitoring Integration

- **Sentry**: Error tracking and performance monitoring
- **Cloudflare Analytics**: Traffic and performance metrics
- **Custom metrics**: Business logic monitoring
- **Uptime monitoring**: External health checks

## Troubleshooting

### Common Issues

#### Deployment Fails

```bash
# Check environment variables
node packages/secrets/dist/cli.js validate

# Verify build output
pnpm turbo run build --filter=web

# Check Cloudflare connection
wrangler whoami
```

#### CSP Violations

```bash
# Test CSP policy
node packages/cloudflare-pages/bin/security.js --validate

# View CSP report
# Check browser console for violations
```

#### Missing Security Headers

```bash
# Test deployment locally
curl -I https://your-deployment-url

# Verify _headers file
cat apps/web/out/_headers
```

### Debug Mode

Enable debug logging:

```bash
export DEBUG=1
export LOG_LEVEL=debug
./scripts/deploy-production.sh
```

## Rollback Procedure

### Quick Rollback

```bash
# Rollback to previous deployment
wrangler pages deployment list --project-name locumtruerate
wrangler pages deployment activate [DEPLOYMENT_ID]
```

### Full Rollback

```bash
# Revert to previous git commit
git revert HEAD
git push origin main

# Redeploy
./scripts/deploy-production.sh
```

## Advanced Configuration

### Custom Domain Setup

1. **Add domain to Cloudflare Pages**
```bash
wrangler pages domain add locumtruerate.com --project-name locumtruerate
```

2. **Configure DNS**
- Add CNAME record pointing to `locumtruerate.pages.dev`
- Enable SSL/TLS encryption

3. **Verify configuration**
```bash
dig locumtruerate.com
curl -I https://locumtruerate.com
```

### Environment-Specific Secrets

```bash
# Set production secrets
wrangler pages secret put DATABASE_URL --project-name locumtruerate
wrangler pages secret put CLERK_SECRET_KEY --project-name locumtruerate

# Set staging secrets
wrangler pages secret put DATABASE_URL --project-name locumtruerate-staging --env staging
```

### Branch Deployments

Preview deployments are automatically created for:
- Pull requests
- Feature branches
- Development branches

Access via: `https://[BRANCH].[PROJECT].pages.dev`

## Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
ANALYZE=true pnpm turbo run build --filter=web

# View bundle report
open apps/web/.next/analyze/bundle-analyzer.html
```

### Lighthouse Audits

```bash
# Run Lighthouse CI
npm run lighthouse

# Check performance scores
cat .lighthouseci/reports/*.json
```

## Security Best Practices

### Regular Security Updates

1. **Monthly security reviews**
   - Update dependencies
   - Review CSP violations
   - Audit access logs
   - Test security headers

2. **Quarterly penetration testing**
   - External security assessment
   - Vulnerability scanning
   - Compliance verification

### Access Control

- Limit deployment access to authorized team members
- Use service accounts for automated deployments
- Enable two-factor authentication for all accounts
- Regular access review and cleanup

## Support and Documentation

### Getting Help

- **Internal Documentation**: `/docs/`
- **Security Issues**: `security@locumtruerate.com`
- **Deployment Issues**: Check GitHub Actions logs
- **Performance Issues**: Review Sentry dashboard

### Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [HIPAA Compliance Checklist](./security/hipaa-compliance.md)
- [Security Header Guide](./security/security-headers.md)

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintainer**: LocumTrueRate Development Team