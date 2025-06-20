# LocumTrueRate.com Environment Variables

This document outlines all environment variables required for production deployment of LocumTrueRate.com, a HIPAA-compliant healthcare job board.

## 🏥 HIPAA Compliance Notice

All environment variables marked with **[HIPAA]** contain or relate to Protected Health Information (PHI) and must follow strict security protocols:

- Use encrypted secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)
- Implement automatic rotation policies
- Audit all access to these variables
- Never log or display these values in plain text

## Core Application Variables

### Database Configuration
```bash
# Primary database connection (REQUIRED)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# Database encryption key for PHI data (REQUIRED) [HIPAA]
DATABASE_ENCRYPTION_KEY="32-character-hex-key-for-field-level-encryption"

# Read replica connection (optional for performance)
DATABASE_READ_URL="postgresql://username:password@replica-host:port/database?sslmode=require"
```

### Authentication (Clerk)
```bash
# Clerk production keys (REQUIRED)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# Clerk webhook signing secret for user events (REQUIRED)
CLERK_WEBHOOK_SECRET="whsec_..."

# Authentication URLs (REQUIRED)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"
```

### Application Security
```bash
# JWT signing secret for API tokens (REQUIRED) [HIPAA]
JWT_SECRET="your-256-bit-secret-key-here"

# NextAuth secret for session encryption (REQUIRED) [HIPAA]
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Application base URL (REQUIRED)
NEXTAUTH_URL="https://locumtruerate.com"

# API rate limiting secret (REQUIRED)
RATE_LIMIT_SECRET="your-rate-limit-secret"
```

### Error Tracking (Sentry)
```bash
# Sentry DSN for error tracking (REQUIRED)
SENTRY_DSN="https://...@sentry.io/..."

# Sentry authentication token for releases (optional)
SENTRY_AUTH_TOKEN="sntrys_..."

# Sentry organization and project (for releases)
SENTRY_ORG="locumtruerate"
SENTRY_PROJECT="web"

# Environment identifier
SENTRY_ENVIRONMENT="production"
```

### Payment Processing (Stripe)
```bash
# Stripe production keys (REQUIRED)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Stripe webhook endpoint secret (REQUIRED)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Stripe Connect platform settings
STRIPE_CONNECT_CLIENT_ID="ca_..."
```

### Email Service
```bash
# Email service provider (choose one)
# Option 1: SendGrid
SENDGRID_API_KEY="SG...."

# Option 2: AWS SES
AWS_SES_ACCESS_KEY_ID="AKIA..."
AWS_SES_SECRET_ACCESS_KEY="..."
AWS_SES_REGION="us-east-1"

# From email addresses
EMAIL_FROM="noreply@locumtruerate.com"
EMAIL_SUPPORT="support@locumtruerate.com"
```

### File Storage (AWS S3)
```bash
# AWS S3 credentials for file uploads [HIPAA]
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="us-east-1"

# S3 bucket names
AWS_S3_BUCKET_RESUMES="locumtruerate-resumes-prod"
AWS_S3_BUCKET_DOCUMENTS="locumtruerate-documents-prod"
AWS_S3_BUCKET_IMAGES="locumtruerate-images-prod"

# CloudFront distribution for file serving
AWS_CLOUDFRONT_DOMAIN="files.locumtruerate.com"
```

### Analytics and Monitoring
```bash
# Google Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID="G-..."

# Mixpanel for user analytics (optional)
NEXT_PUBLIC_MIXPANEL_TOKEN="..."

# Application monitoring
NEW_RELIC_LICENSE_KEY="..."
NEW_RELIC_APP_NAME="LocumTrueRate-Production"
```

### Feature Flags
```bash
# Feature toggles for gradual rollouts
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_CHAT="true"
NEXT_PUBLIC_ENABLE_NOTIFICATIONS="true"
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH="true"
ENABLE_JOB_BOOST_PAYMENTS="true"
ENABLE_COMPANY_VERIFICATION="true"
```

### HIPAA Compliance Settings
```bash
# Audit logging configuration [HIPAA]
AUDIT_LOG_RETENTION_DAYS="2555"  # 7 years for HIPAA
AUDIT_LOG_ENCRYPTION_KEY="your-audit-encryption-key"

# PHI data retention settings [HIPAA]
PHI_RETENTION_DAYS="2555"  # 7 years for HIPAA
PHI_PURGE_SCHEDULE="0 2 * * 0"  # Weekly at 2 AM

# Compliance reporting
COMPLIANCE_REPORT_EMAIL="compliance@locumtruerate.com"
HIPAA_OFFICER_EMAIL="hipaa@locumtruerate.com"
```

### External API Keys
```bash
# Background check service (if applicable)
BACKGROUND_CHECK_API_KEY="..."
BACKGROUND_CHECK_API_URL="https://api.backgroundcheck.com"

# License verification service
LICENSE_VERIFICATION_API_KEY="..."
LICENSE_VERIFICATION_API_URL="https://api.licenseverification.com"

# Geocoding service for location search
GOOGLE_MAPS_API_KEY="..."
```

## Environment-Specific Configurations

### Production Environment
```bash
NODE_ENV="production"
NEXT_PUBLIC_APP_ENV="production"
ENABLE_DEBUG_LOGS="false"
ENABLE_PROFILING="false"
```

### Staging Environment
```bash
NODE_ENV="production"
NEXT_PUBLIC_APP_ENV="staging"
ENABLE_DEBUG_LOGS="true"
ENABLE_PROFILING="true"
```

## Security Best Practices

### 1. Secret Management
- Use cloud-native secret management services:
  - **AWS**: AWS Secrets Manager or AWS Parameter Store
  - **Azure**: Azure Key Vault
  - **GCP**: Google Secret Manager
  - **Vercel**: Vercel Environment Variables
  - **Railway**: Railway Variables

### 2. Rotation Schedule
- **Weekly**: API keys for external services
- **Monthly**: Database passwords, JWT secrets
- **Quarterly**: Encryption keys (with proper migration)

### 3. Access Control
- Limit access to production secrets to essential personnel only
- Use temporary credentials when possible
- Implement break-glass procedures for emergency access

### 4. Monitoring
- Set up alerts for secret access/usage
- Monitor for secrets accidentally committed to git
- Implement secret scanning in CI/CD pipelines

## Deployment Checklist

### Before Deployment
- [ ] All required environment variables are set
- [ ] Secrets are stored in secure secret management system
- [ ] Database connection tested with production credentials
- [ ] HTTPS certificates are valid and properly configured
- [ ] Sentry error tracking is configured and tested
- [ ] Stripe webhooks are configured with correct endpoints

### HIPAA Compliance Verification
- [ ] Database encryption at rest is enabled
- [ ] All PHI-related environment variables use encryption
- [ ] Audit logging is properly configured
- [ ] Data retention policies are implemented
- [ ] Backup encryption is enabled
- [ ] Access logs are being captured

### Post-Deployment Verification
- [ ] Application loads without errors
- [ ] Authentication flow works correctly
- [ ] Payment processing functions properly
- [ ] Error tracking captures issues
- [ ] Email sending works correctly
- [ ] File uploads work and are secure

## Troubleshooting Common Issues

### Authentication Errors
1. Verify Clerk keys are for production environment
2. Check webhook secret matches Clerk dashboard
3. Ensure NEXTAUTH_URL matches production domain

### Database Connection Issues
1. Verify DATABASE_URL format and credentials
2. Check SSL mode is set to 'require'
3. Ensure database allows connections from production IP

### Payment Processing Issues
1. Verify Stripe keys are live (not test) keys
2. Check webhook endpoints are configured in Stripe dashboard
3. Ensure HTTPS is properly configured for webhooks

### File Upload Issues
1. Verify AWS credentials have proper S3 permissions
2. Check bucket names exist and are accessible
3. Ensure CORS is configured on S3 buckets

## Emergency Procedures

### Security Breach Response
1. Immediately rotate all secrets
2. Review audit logs for unauthorized access
3. Notify HIPAA compliance officer
4. Document incident for compliance reporting

### Service Outage Response
1. Check all external service status (Clerk, Stripe, AWS)
2. Verify environment variables are properly set
3. Review Sentry for application errors
4. Switch to backup services if available

---

**Last Updated**: June 2025  
**Next Review**: Monthly or after any security incident