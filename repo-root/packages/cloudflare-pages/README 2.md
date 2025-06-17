# @locumtruerate/cloudflare-pages

Comprehensive Cloudflare Pages deployment and security configuration for LocumTrueRate platform.

## Features

- 🚀 Automated deployment to Cloudflare Pages
- 🛡️ HIPAA-compliant security headers and CSP
- ⚡ Performance optimization and monitoring
- 🔧 CLI tools for deployment and security management
- 📊 Bundle analysis and performance budgets
- 🌍 Multi-environment support (dev/staging/prod)
- 🔐 Content Security Policy builder and validator
- 📱 Mobile-first responsive optimization

## Installation

```bash
pnpm add @locumtruerate/cloudflare-pages
```

## Quick Start

### 1. Initialize Configuration

```bash
# Initialize with interactive prompts
npx cf-pages-deploy init

# Or use a specific template
npx cf-pages-deploy init --template nextjs
```

### 2. Deploy to Cloudflare Pages

```bash
# Deploy to production
npx cf-pages-deploy deploy

# Deploy to staging
npx cf-pages-deploy deploy --environment staging

# Dry run (show what would be deployed)
npx cf-pages-deploy deploy --dry-run
```

### 3. Manage Security Headers

```bash
# Generate security headers file
npx cf-pages-security generate-headers

# Validate CSP policy
npx cf-pages-security validate-csp

# Audit live site security
npx cf-pages-security audit --url https://locumtruerate.com

# Interactive CSP builder
npx cf-pages-security build-csp
```

## Programmatic Usage

### Basic Deployment

```typescript
import { CloudflarePagesDeploy, createDefaultConfig } from '@locumtruerate/cloudflare-pages';

// Create configuration
const config = createDefaultConfig('production', 'locumtruerate', 'your-account-id');

// Deploy
const deployment = new CloudflarePagesDeploy(config);
const result = await deployment.deploy();

if (result.success) {
  console.log('Deployed to:', result.url);
} else {
  console.error('Deployment failed:', result.error);
}
```

### Security Headers Management

```typescript
import { SecurityHeaders, defaultConfigs } from '@locumtruerate/cloudflare-pages';

// Create security headers for production
const config = defaultConfigs.production;
const securityHeaders = new SecurityHeaders(config);

// Generate _headers file content
const headersContent = securityHeaders.generateHeadersFile();

// Validate CSP
const validation = securityHeaders.validateCSP();
if (!validation.valid) {
  console.error('CSP validation failed:', validation.errors);
}
```

### Performance Optimization

```typescript
import { Performance } from '@locumtruerate/cloudflare-pages';

// Analyze bundle size
const analysis = Performance.analyzeBundleSize('./dist');
console.log('Total size:', analysis.totalSize);
console.log('Recommendations:', analysis.recommendations);

// Generate performance budget
const budget = Performance.generatePerformanceBudget();
console.log('Performance budget:', budget.budgets);
```

## Configuration

### Environment Templates

The package includes templates for common frameworks:

- **SPA**: Generic single-page application
- **Next.js**: Next.js with static export
- **Vite**: Vite build configuration
- **Nuxt**: Nuxt.js generate mode

```typescript
import { configTemplates } from '@locumtruerate/cloudflare-pages';

const config = configTemplates.nextjs('my-project', 'account-id', 'production');
```

### Custom Configuration

```typescript
import { createDefaultConfig, mergeConfigs } from '@locumtruerate/cloudflare-pages';

const baseConfig = createDefaultConfig('production', 'project', 'account-id');

const customConfig = mergeConfigs(baseConfig, {
  buildCommand: 'npm run build:custom',
  environmentVariables: {
    CUSTOM_VAR: 'value'
  },
  security: {
    features: {
      analytics: false // Disable analytics
    }
  }
});
```

## Security Features

### Content Security Policy (CSP)

Automatically generates HIPAA-compliant CSP policies:

```typescript
const securityHeaders = new SecurityHeaders({
  enableCSP: true,
  environment: 'production',
  domains: {
    main: 'locumtruerate.com',
    api: 'api.locumtruerate.com',
    cdn: 'cdn.locumtruerate.com',
    assets: 'assets.locumtruerate.com'
  },
  features: {
    analytics: true,
    monitoring: true,
    webGL: false,
    geolocation: true
  }
});

const csp = securityHeaders.generateCSP();
// Generates: default-src 'self'; script-src 'self' 'strict-dynamic' https://clerk.dev...
```

### Security Headers

Includes all essential security headers:

- **Content-Security-Policy**: Prevent XSS and injection attacks
- **Strict-Transport-Security**: Enforce HTTPS
- **X-Frame-Options**: Prevent clickjacking
- **X-Content-Type-Options**: Prevent MIME sniffing
- **Referrer-Policy**: Control referrer information
- **Permissions-Policy**: Control browser features

### HIPAA Compliance Features

- Encryption in transit (HTTPS enforcement)
- Access logging and monitoring
- Content type validation
- Referrer policy for privacy
- No-index headers for sensitive routes

## CLI Commands

### Deployment Commands

```bash
# Deploy with default settings
cf-pages-deploy deploy

# Deploy specific environment
cf-pages-deploy deploy --environment staging --project my-app

# Deploy with custom configuration
cf-pages-deploy deploy --config ./my-config.json

# Check deployment status
cf-pages-deploy status --project my-app

# List all deployments
cf-pages-deploy list
```

### Security Commands

```bash
# Generate _headers file
cf-pages-security generate-headers --environment production

# Validate CSP policy
cf-pages-security validate-csp --environment production

# Audit live site
cf-pages-security audit --url https://example.com

# Interactive CSP builder
cf-pages-security build-csp

# Generate security.txt
cf-pages-security generate-security-txt --domain example.com
```

## Performance Optimization

### Bundle Analysis

```typescript
import { Performance } from '@locumtruerate/cloudflare-pages';

const analysis = Performance.analyzeBundleSize('./dist');

// Get recommendations
analysis.recommendations.forEach(rec => console.log(rec));

// Check file sizes
analysis.files.forEach(file => {
  console.log(`${file.name}: ${file.size} bytes (${file.gzipped} gzipped)`);
});
```

### Web Vitals Monitoring

```typescript
// Generated monitoring code
const vitalsCode = Performance.generateWebVitalsMonitoring();

// Include in your application to track:
// - Cumulative Layout Shift (CLS)
// - First Input Delay (FID)
// - First Contentful Paint (FCP)
// - Largest Contentful Paint (LCP)
// - Time to First Byte (TTFB)
```

### Lighthouse CI

```typescript
const lighthouseConfig = Performance.generateLighthouseConfig();

// Use with lighthouse-ci
// Enforces performance budgets:
// - Performance: 85%
// - Accessibility: 95%
// - Best Practices: 90%
// - SEO: 90%
```

## Environment Variables

Set these environment variables for deployment:

```bash
# Required
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id

# Optional
CLOUDFLARE_PROJECT_NAME=locumtruerate
NODE_ENV=production
LOG_LEVEL=info
```

## Integration Examples

### Next.js Integration

```javascript
// next.config.js
const { SecurityHeaders, defaultConfigs } = require('@locumtruerate/cloudflare-pages');

const securityHeaders = new SecurityHeaders(defaultConfigs.production);
const headers = securityHeaders.generateHeaders();

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: Object.entries(headers).map(([key, value]) => ({
          key,
          value
        }))
      }
    ];
  }
};
```

### GitHub Actions Integration

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Deploy to Cloudflare Pages
        run: npx cf-pages-deploy deploy --environment production
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## Troubleshooting

### Common Issues

1. **CSP Violations**: Use the CSP validator to identify issues
2. **Build Failures**: Check build output directory exists
3. **Missing Headers**: Verify _headers file is in build output
4. **Performance Issues**: Use bundle analyzer for optimization

### Debug Mode

```bash
# Enable debug logging
DEBUG=cf-pages:* cf-pages-deploy deploy

# Validate configuration
cf-pages-deploy deploy --dry-run --config ./config.json
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT