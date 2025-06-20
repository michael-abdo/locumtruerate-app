# Sentry Setup Guide for LocumTrueRate Healthcare Application

## Overview

Sentry has been integrated into the LocumTrueRate application to provide HIPAA-compliant error tracking and performance monitoring for healthcare applications. This guide covers the production setup and configuration.

## HIPAA Compliance Features

✅ **PHI Protection**: All configurations include automatic PII/PHI scrubbing
✅ **Data Minimization**: Only essential error data is captured
✅ **Audit Logging**: Error tracking provides audit trails for compliance
✅ **Secure Transmission**: All data is encrypted in transit and at rest
✅ **Data Retention**: Configurable retention policies for healthcare compliance

## Production Setup

### 1. Create Sentry Account and Project

1. Sign up for Sentry at [sentry.io](https://sentry.io)
2. Choose the **Healthcare/HIPAA Compliant** plan
3. Create a new project:
   - Name: `locumtruerate-web`
   - Platform: `Next.js`
   - Team: `locumtruerate`

### 2. Obtain Required Keys

After creating the project, you'll need:

- **DSN (Data Source Name)**: `https://[key]@[organization].ingest.sentry.io/[project-id]`
- **Auth Token**: For uploading source maps and releases
- **Organization Slug**: Your Sentry organization identifier

### 3. Update Environment Variables

Replace the placeholder values in your production environment:

```bash
# Production Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://[your-key]@[your-org].ingest.sentry.io/[project-id]
SENTRY_DSN=https://[your-key]@[your-org].ingest.sentry.io/[project-id]
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=locumtruerate-web
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_RELEASE=v1.0.0  # Use your release version
ENABLE_SENTRY=true
```

### 4. Configure Sentry Project Settings

#### Performance Monitoring
- **Tracing Sample Rate**: 10% for production (performance vs. cost balance)
- **Performance Issues**: Enable for database queries, API calls
- **Web Vitals**: Monitor Core Web Vitals for user experience

#### Error Handling
- **Error Rate Limit**: 100 errors per minute per project
- **Issue Grouping**: Configure smart grouping for healthcare-specific errors
- **Notification Rules**: Set up alerts for critical healthcare application errors

#### Data Scrubbing (CRITICAL for HIPAA)
Configure these data scrubbers in Sentry project settings:

```json
{
  "applications": {
    "*": [
      "@ip",
      "@email",
      "@mac",
      "@creditcard"
    ]
  },
  "dataScrubbers": [
    {
      "type": "regex",
      "pattern": "\\b\\d{3}-\\d{2}-\\d{4}\\b",
      "replacement": "[SSN-REDACTED]"
    },
    {
      "type": "regex", 
      "pattern": "\\b\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\b",
      "replacement": "[CARD-REDACTED]"
    },
    {
      "type": "regex",
      "pattern": "mrn[\"']?\\s*[:=]\\s*[\"']?\\w+",
      "replacement": "mrn=\"[MRN-REDACTED]\""
    }
  ]
}
```

### 5. Release Management

Set up automatic releases for deployment tracking:

```bash
# In your CI/CD pipeline
export SENTRY_RELEASE=$(git rev-parse HEAD)

# Create release
sentry-cli releases new $SENTRY_RELEASE

# Upload source maps
sentry-cli releases files $SENTRY_RELEASE upload-sourcemaps ./build/static/js

# Finalize release
sentry-cli releases finalize $SENTRY_RELEASE

# Associate commits
sentry-cli releases set-commits $SENTRY_RELEASE --auto
```

## Healthcare-Specific Configuration

### 1. Alert Rules for Healthcare Applications

Configure alerts for critical healthcare application events:

**Critical Alerts** (Immediate notification):
- Authentication failures > 10/minute
- Database connection failures
- Payment processing errors
- PHI access errors

**Warning Alerts** (15-minute delay):
- High error rates (>5% of requests)
- Performance degradation (>3s response times)
- Memory leaks or high resource usage

### 2. User Context (HIPAA-Compliant)

The application automatically sanitizes user context:

```javascript
// Automatically applied by our Sentry configuration
user: {
  id: '[REDACTED]',           // Never log actual user IDs
  role: 'physician',          // Safe to log user roles
  // email: '[REMOVED]',      // Email addresses are scrubbed
  // ip_address: '[REMOVED]'  // IP addresses are scrubbed
}
```

### 3. Error Grouping for Healthcare

Configure custom fingerprinting for healthcare-specific errors:

```javascript
// Healthcare-specific error grouping
fingerprint: [
  'healthcare-auth-error',
  'patient-data-access-error', 
  'billing-system-error',
  'hipaa-compliance-error'
]
```

## Monitoring and Maintenance

### 1. Weekly Health Checks

- Review error trends and patterns
- Check alert fatigue (too many/too few alerts)
- Verify PHI scrubbing is working correctly
- Monitor performance metrics

### 2. Monthly Compliance Review

- Audit user context data for any PHI leakage
- Review data retention settings
- Verify notification recipients are current
- Check team access permissions

### 3. Quarterly Security Assessment

- Review data scrubbing configurations
- Audit user access and permissions
- Update alert thresholds based on usage patterns
- Test incident response procedures

## Integration Testing

### 1. Test Error Reporting

```javascript
// Test client-side error reporting
import { useSentryErrorReporting } from '@/components/error/sentry-error-boundary'

const { reportError } = useSentryErrorReporting()

// Test error with healthcare context
reportError(new Error('Test healthcare error'), {
  level: 'warning',
  tags: { component: 'patient-portal' },
  extra: { action: 'data-access' }
})
```

### 2. Test PHI Scrubbing

```javascript
// This should be automatically scrubbed
const testData = {
  ssn: '123-45-6789',          // Should become '[SSN-REDACTED]'
  email: 'patient@email.com',   // Should be removed
  mrn: 'MRN123456',            // Should become '[MRN-REDACTED]'
  role: 'patient'               // Should remain (safe)
}
```

### 3. Verify Performance Monitoring

- Check that database queries are being tracked
- Verify API response times are monitored
- Confirm user interactions are captured (without PHI)

## Cost Management

### Production Cost Estimates

- **Professional Plan**: $26/month per 10K errors
- **Performance Monitoring**: Additional 10K transactions/month included
- **Source Maps**: Included in plan
- **Retention**: 90 days (configurable)

### Cost Optimization

1. **Smart Sampling**: Use 10% transaction sampling in production
2. **Error Filtering**: Filter out non-actionable errors (network failures, etc.)
3. **Alert Tuning**: Reduce noise to prevent alert fatigue
4. **Regular Cleanup**: Archive or delete old releases

## Security Considerations

### 1. Access Control

- Use service accounts for CI/CD integration
- Implement principle of least privilege
- Regular access reviews for team members
- Two-factor authentication required

### 2. Data Protection

- Enable all available data scrubbers
- Custom regex patterns for healthcare-specific data
- Regular audits of captured data
- Secure transmission (TLS 1.3)

### 3. Incident Response

When Sentry alerts trigger:

1. **Immediate Response** (0-15 minutes):
   - Acknowledge alert
   - Assess severity and patient impact
   - Notify on-call healthcare team if needed

2. **Investigation** (15-60 minutes):
   - Review error context and stack traces
   - Check for PHI exposure in error data
   - Determine root cause

3. **Resolution** (1-4 hours):
   - Implement fix or workaround
   - Verify fix in staging environment
   - Deploy to production
   - Monitor for resolution

4. **Post-Incident** (24-48 hours):
   - Document incident and resolution
   - Update runbooks if needed
   - Review PHI handling procedures
   - Conduct team retrospective

## Support and Documentation

- **Sentry Documentation**: [docs.sentry.io](https://docs.sentry.io)
- **Healthcare Compliance**: [sentry.io/security](https://sentry.io/security)
- **Next.js Integration**: [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs)
- **HIPAA Guidelines**: Internal compliance documentation

## Troubleshooting

### Common Issues

1. **Source Maps Not Uploading**
   - Verify `SENTRY_AUTH_TOKEN` is correct
   - Check build process includes source map generation
   - Ensure Sentry CLI has proper permissions

2. **PHI Appearing in Errors**
   - Review data scrubbing configuration
   - Add custom regex patterns for your data
   - Update client-side filtering logic

3. **Too Many Alerts**
   - Adjust error rate thresholds
   - Filter out non-actionable errors
   - Use smart alert grouping

4. **Performance Impact**
   - Reduce tracing sample rate
   - Filter out high-frequency operations
   - Use selective instrumentation

This Sentry setup provides production-ready error tracking and performance monitoring specifically configured for healthcare applications with HIPAA compliance requirements.