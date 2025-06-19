# App Store Assets

This directory contains all assets and metadata required for app store submissions.

## Directory Structure

```
store/
├── app-store-metadata.json     # Complete app metadata
├── screenshot-generator.tsx    # React components for screenshots
├── README.md                  # This file
├── icons/                     # App icons (to be generated)
├── screenshots/               # Generated screenshots
└── promotional/               # Marketing materials
```

## App Store Metadata

The `app-store-metadata.json` file contains:

- App name, description, and keywords
- iOS and Android specific metadata
- Screenshot specifications
- Contact information
- Release notes

## Screenshot Requirements

### iOS App Store
- **iPhone 6.7"** (iPhone 14 Pro Max): 1290 x 2796 pixels
- **iPhone 6.5"** (iPhone 14 Plus): 1284 x 2778 pixels  
- **iPhone 5.5"** (iPhone 8 Plus): 1242 x 2208 pixels
- **iPad Pro 12.9"**: 2048 x 2732 pixels

### Google Play Store
- **Phone**: 1080 x 1920 pixels minimum
- **7" Tablet**: 1200 x 1920 pixels
- **10" Tablet**: 1800 x 2560 pixels

## Screenshot Content Plan

### Primary Screenshots (Required)
1. **Job Search Home** - Main job listing with filters
2. **Job Details** - Detailed job view with apply button
3. **Rate Calculator** - Calculator with sample calculation
4. **Profile & Settings** - User profile and biometric setup
5. **Offline Mode** - Offline indicator and saved jobs

### Secondary Screenshots (Optional)
6. **Dashboard** - Analytics and saved searches
7. **Messages** - Chat with recruiters
8. **Document Manager** - Credential storage
9. **Notifications** - Job alerts and updates
10. **Premium Features** - Subscription benefits

## App Icons

Required icon sizes:

### iOS
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro @2x)
- 152x152 (iPad @2x)
- 76x76 (iPad @1x)

### Android
- 512x512 (Google Play)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)

## Promotional Materials

### App Store Graphics
- **iOS App Preview Video**: 15-30 seconds
- **Feature Graphic**: 1024 x 500 pixels
- **Promotional Images**: Various sizes for campaigns

### Marketing Copy
- **Tagline**: "Find Your Perfect Locum Tenens Position"
- **Value Props**:
  - Comprehensive job search
  - Smart rate calculator
  - Offline access
  - Secure applications
  - Real-time notifications

## ASO (App Store Optimization)

### Primary Keywords
- locum tenens
- physician jobs
- doctor jobs
- medical jobs
- healthcare jobs

### Long-tail Keywords
- temporary physician positions
- locum tenens calculator
- medical staffing app
- physician recruiting
- healthcare career app

### Competitor Analysis
- Analyze similar apps for positioning
- Monitor keyword rankings
- Track download trends

## Localization

### Tier 1 Markets (English)
- United States
- Canada
- United Kingdom
- Australia

### Future Localization
- Spanish (US Hispanic market)
- French (Canadian market)

## Privacy & Compliance

### Privacy Features to Highlight
- HIPAA-compliant security
- Biometric authentication
- Encrypted data storage
- No sharing of personal data

### Compliance Statements
- HIPAA compliance badge
- SOC 2 Type II certified
- Medical data encryption

## Asset Generation Workflow

1. **Design Phase**
   - Create high-fidelity mockups
   - Generate sample data
   - Review with stakeholders

2. **Screenshot Generation**
   - Use React components for consistency
   - Generate for all required sizes
   - Include device frames

3. **Icon Creation**
   - Design master icon
   - Generate all required sizes
   - Test on different backgrounds

4. **Review Process**
   - Internal review
   - Legal review for medical claims
   - A/B testing consideration

## Tools & Resources

### Design Tools
- Figma for mockups
- React Native for screenshots
- ImageMagick for batch processing

### Screenshot Tools
- Device frames from Facebook
- Screenshot automation scripts
- Simulator screenshot tools

### Analytics
- App Store Connect analytics
- Google Play Console insights
- Third-party ASO tools

## Submission Checklist

### iOS App Store
- [ ] App metadata complete
- [ ] Screenshots for all devices
- [ ] App icons in all sizes
- [ ] App preview video (optional)
- [ ] Privacy policy URL
- [ ] Support URL

### Google Play Store
- [ ] Store listing complete
- [ ] Feature graphic uploaded
- [ ] Screenshots for all devices
- [ ] App icon uploaded
- [ ] Privacy policy link
- [ ] Target age rating

### Both Stores
- [ ] App descriptions optimized
- [ ] Keywords researched
- [ ] Ratings & reviews strategy
- [ ] Launch marketing plan