# LocumTrueRate Mobile App Deployment Guide

## Overview

This guide covers the complete deployment process for the LocumTrueRate mobile application, from development builds to production app store releases.

## Prerequisites

### Required Accounts
- [ ] Expo Account (with EAS Build access)
- [ ] Apple Developer Account ($99/year)
- [ ] Google Play Console Account ($25 one-time)
- [ ] Sentry Account (for crash reporting)

### Required Tools
```bash
npm install -g @expo/cli
npm install -g eas-cli
```

### Environment Setup
```bash
# Login to Expo
expo login

# Login to EAS
eas login

# Verify authentication
eas whoami
```

## Configuration

### 1. Update App Configuration

Update `app.json` with production values:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_ACTUAL_PROJECT_ID"
      },
      "sentryDsn": "YOUR_ACTUAL_SENTRY_DSN"
    }
  }
}
```

### 2. iOS Setup

#### App Store Connect
1. Create new app in App Store Connect
2. Set bundle ID: `com.locumtruerate.app`
3. Update `eas.json` with actual ASC App ID

#### Code Signing
```bash
# Generate development build
eas build --platform ios --profile development

# Generate preview build
eas build --platform ios --profile preview

# Generate production build
eas build --platform ios --profile production
```

### 3. Android Setup

#### Google Play Console
1. Create new app in Google Play Console
2. Set package name: `com.locumtruerate.app`
3. Generate service account key
4. Save as `service-account-key.json`

#### Build Configuration
```bash
# Generate development APK
eas build --platform android --profile development

# Generate preview APK
eas build --platform android --profile preview

# Generate production AAB
eas build --platform android --profile production
```

## Build Process

### Development Builds

For internal testing and development:

```bash
# iOS Development Build
eas build --platform ios --profile development

# Android Development Build
eas build --platform android --profile development

# Both platforms
eas build --profile development
```

### Preview Builds

For stakeholder testing and QA:

```bash
# iOS Preview (TestFlight)
eas build --platform ios --profile preview

# Android Preview (Internal Testing)
eas build --platform android --profile preview

# Both platforms
eas build --profile preview
```

### Production Builds

For app store submission:

```bash
# iOS Production
eas build --platform ios --profile production

# Android Production
eas build --platform android --profile production

# Both platforms
eas build --profile production
```

## Testing & QA

### Internal Alpha Testing

#### iOS (TestFlight)
```bash
# Submit to TestFlight
eas submit --platform ios --profile preview

# Add internal testers in App Store Connect
# Share TestFlight link with team
```

#### Android (Internal Testing)
```bash
# Submit to Internal Testing
eas submit --platform android --profile preview

# Add internal testers in Google Play Console
# Share testing link with team
```

### Beta Testing

#### iOS (TestFlight External Testing)
1. Build production version
2. Submit for App Store review
3. Add external testers (max 10,000)
4. Distribute to beta testers

#### Android (Closed Testing)
1. Upload production AAB
2. Create closed testing track
3. Add tester email addresses
4. Publish to closed testing

## Production Deployment

### iOS App Store

#### Pre-submission Checklist
- [ ] App metadata complete in App Store Connect
- [ ] Screenshots uploaded (all required sizes)
- [ ] Privacy policy URL set
- [ ] App review information provided
- [ ] Export compliance information

#### Submission Process
```bash
# Build production version
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios --profile production
```

#### App Store Review
1. Upload successful → "Waiting for Review"
2. Review process (1-7 days)
3. Approved → "Pending Developer Release"
4. Release manually or automatically

### Google Play Store

#### Pre-submission Checklist
- [ ] Store listing complete
- [ ] Feature graphic uploaded
- [ ] Screenshots for all device types
- [ ] Privacy policy URL set
- [ ] Content rating questionnaire completed
- [ ] Target audience and content settings

#### Submission Process
```bash
# Build production version
eas build --platform android --profile production

# Submit to Google Play
eas submit --platform android --profile production
```

#### Play Console Review
1. Upload successful → "Under review"
2. Review process (few hours to 3 days)
3. Approved → "Published"

## Updates & Maintenance

### Over-the-Air (OTA) Updates

For JavaScript/TypeScript changes only:

```bash
# Publish update to preview channel
eas update --branch preview --message "Bug fixes and improvements"

# Publish update to production channel
eas update --branch production --message "New features and bug fixes"
```

### Native Updates

For changes requiring native code (plugins, permissions):

```bash
# Increment version in app.json
# Build new version
eas build --profile production

# Submit to stores
eas submit --profile production
```

## Monitoring & Analytics

### Crash Reporting (Sentry)
- Monitor crash reports in Sentry dashboard
- Set up alerts for new issues
- Track release adoption

### App Store Analytics
- Monitor download metrics
- Track user engagement
- Analyze store listing performance

### Performance Monitoring
- Track app launch times
- Monitor API response times
- Analyze user flows

## Rollback Strategy

### OTA Rollback
```bash
# Rollback to previous update
eas update rollback --branch production
```

### Native Rollback
1. Phased release rollback (Google Play)
2. Remove from sale (App Store)
3. Submit hotfix build

## Troubleshooting

### Common Build Issues

#### iOS Build Failures
```bash
# Clear cache and retry
eas build --platform ios --clear-cache

# Check provisioning profiles
eas device:list
eas credentials
```

#### Android Build Failures
```bash
# Clear cache and retry
eas build --platform android --clear-cache

# Check keystore
eas credentials
```

### Submission Issues

#### iOS Rejections
- Review App Store Guidelines
- Check for common rejection reasons
- Test on multiple device sizes
- Verify in-app purchase implementations

#### Android Rejections
- Review Play Console policy
- Check target API level requirements
- Verify permissions usage
- Test on various Android versions

## Automation

### CI/CD Pipeline

Example GitHub Actions workflow:

```yaml
name: EAS Build
on:
  push:
    branches: [main]
    
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Install dependencies
        run: npm install
      - name: Build on EAS
        run: eas build --platform all --non-interactive
```

### Automated Testing
```bash
# Run tests before build
npm test

# Run E2E tests
npm run test:e2e

# Check bundle size
npm run analyze
```

## Security Considerations

### Code Signing
- Secure storage of certificates
- Regular certificate renewal
- Proper keystore management

### API Keys
- Use environment variables
- Secure key storage
- Regular key rotation

### Privacy Compliance
- HIPAA compliance verification
- GDPR compliance for EU users
- Privacy policy updates
- Data handling documentation

## Performance Optimization

### Bundle Size
```bash
# Analyze bundle size
npx @expo/bundle-analyzer

# Optimize assets
npx expo optimize

# Remove unused dependencies
npm audit
```

### Runtime Performance
- Monitor JavaScript thread usage
- Optimize image loading
- Implement lazy loading
- Use performance profiling

## Support & Maintenance

### User Support
- Monitor app store reviews
- Respond to user feedback
- Maintain help documentation
- Track support tickets

### Regular Maintenance
- Update dependencies monthly
- Security patch releases
- Performance optimization
- Feature updates based on user feedback

## Compliance & Legal

### Medical App Compliance
- FDA guidance for medical apps
- HIPAA compliance verification
- Medical device regulations (if applicable)
- Professional liability considerations

### App Store Compliance
- Regular guideline reviews
- Policy update compliance
- Age rating maintenance
- Content moderation

This deployment guide should be updated as the app evolves and new requirements emerge.