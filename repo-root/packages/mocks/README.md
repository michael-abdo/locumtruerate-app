# Mock Services Package

Mock implementations of external APIs for testing purposes. Provides realistic mock servers for Stripe, Zapier, and email services.

## Features

- **Stripe Mock Server**: Complete payment and subscription API simulation
- **Email Mock Server**: SendGrid-compatible email API with inbox management
- **Zapier Mock Server**: Webhook endpoint simulation with event tracking
- **Server Manager**: Coordinated management of all mock services
- **Test Integration**: Jest-compatible test utilities and setup

## Quick Start

```typescript
import { MockServerManager } from '@locumtruerate/mocks';

// Create manager with default configuration
const manager = new MockServerManager(MockServerManager.createDefaultConfig());

// Initialize and start all services
await manager.initialize();
await manager.startAll();

// Services are now available:
// - Stripe: http://localhost:4242
// - Zapier: http://localhost:4243  
// - Email: http://localhost:4244

// Clean up
await manager.stopAll();
```

## Individual Services

### Stripe Mock Server

```typescript
import { StripeMockServer } from '@locumtruerate/mocks/stripe';

const stripe = new StripeMockServer({
  port: 4242,
  cors: { origin: 'http://localhost:3000' },
  webhookEndpoint: '/webhooks/stripe'
});

await stripe.start();
// Mock Stripe API available at http://localhost:4242
```

**Available Endpoints:**
- `POST /v1/customers` - Create customer
- `GET /v1/customers/:id` - Get customer
- `POST /v1/payment_intents` - Create payment intent
- `POST /v1/payment_intents/:id/confirm` - Confirm payment
- `POST /v1/subscriptions` - Create subscription
- `GET /v1/subscriptions/:id` - Get subscription
- `DELETE /v1/subscriptions/:id` - Cancel subscription

### Email Mock Server

```typescript
import { EmailMockServer } from '@locumtruerate/mocks/email';

const email = new EmailMockServer({
  port: 4244,
  cors: { origin: 'http://localhost:3000' }
});

await email.start();
// Email API available at http://localhost:4244
```

**Available Endpoints:**
- `POST /v3/mail/send` - SendGrid-compatible email sending
- `POST /send` - Generic email sending
- `GET /emails` - List received emails
- `GET /emails/:id` - Get specific email
- `GET /search` - Search emails
- `DELETE /emails` - Clear all emails

### Zapier Mock Server

```typescript
import { ZapierMockServer } from '@locumtruerate/mocks/zapier';

const zapier = new ZapierMockServer({
  port: 4243,
  webhookSecret: 'test_secret',
  enableAuth: false
});

await zapier.start();
// Webhook endpoints available at http://localhost:4243
```

**Available Endpoints:**
- `POST /hooks/*` - Generic webhook receiver
- `POST /hooks/job-posted` - Job posting webhook
- `POST /hooks/job-applied` - Job application webhook
- `GET /webhooks` - List received webhooks
- `GET /stats` - Webhook statistics

## Testing Integration

The package includes Jest configuration and test utilities:

```typescript
// jest.setup.js provides global utilities
describe('API Tests', () => {
  it('should wait for mock server', async () => {
    await global.testUtils.waitForPort(4242);
    // Server is ready for testing
  });
});
```

## Configuration Options

### MockServerConfig
```typescript
interface MockServerConfig {
  port: number;
  host?: string;
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
}
```

### Service-Specific Options

**StripeMockConfig:**
- `webhookEndpoint?: string` - Webhook simulation endpoint
- `defaultCurrency?: string` - Default currency for payments

**ZapierMockConfig:**
- `webhookSecret?: string` - HMAC webhook validation secret
- `enableAuth?: boolean` - Enable signature validation

**EmailMockConfig:**
- `smtpPort?: number` - SMTP server port (if enabled)
- `enableSMTP?: boolean` - Enable SMTP server

## Development

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type checking
pnpm type-check
```

## Environment Variables

For integration with test environments:

```bash
# Test environment file (.env.test)
STRIPE_MOCK_URL=http://localhost:4242
ZAPIER_MOCK_URL=http://localhost:4243
EMAIL_MOCK_URL=http://localhost:4244

# Disable real API calls in tests
ENABLE_STRIPE_WEBHOOKS=false
ENABLE_EMAIL_SENDING=false
```

## Usage in Tests

```typescript
import { MockServerManager } from '@locumtruerate/mocks';

describe('Integration Tests', () => {
  let mockManager: MockServerManager;

  beforeAll(async () => {
    mockManager = new MockServerManager(
      MockServerManager.createDefaultConfig()
    );
    await mockManager.initialize();
    await mockManager.startAll();
  });

  afterAll(async () => {
    await mockManager.cleanup();
  });

  beforeEach(() => {
    // Clear data between tests
    mockManager.resetAllData();
  });

  it('should process payment', async () => {
    const stripeServer = mockManager.getServer('stripe');
    // Test with stripe server running
  });
});
```

## Architecture

The mock services are designed to:

1. **Maintain API Compatibility**: Exact endpoint matching with real services
2. **Provide Realistic Responses**: Proper status codes, headers, and data structures
3. **Support Testing Scenarios**: Success, failure, and edge case simulation
4. **Enable Test Isolation**: Independent data storage per test run
5. **Cross-Platform Compatibility**: Work across web and mobile test environments

This supports the mobile-first architecture requirement by ensuring all external API integrations can be thoroughly tested across platforms without dependencies on external services.