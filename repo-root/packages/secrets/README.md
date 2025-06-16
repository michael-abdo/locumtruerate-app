# @locumtruerate/secrets

Comprehensive secrets management for LocumTrueRate platform with encryption, rotation, and multi-provider support.

## Features

- 🔐 AES-256-GCM encryption for all secrets
- 🔄 Automated secret rotation with configurable policies
- 🏥 HIPAA-compliant security measures
- 📦 Multiple provider support (Environment, Cloudflare KV)
- 🛡️ Secret validation and complexity requirements
- 📊 Audit logging and compliance tracking
- 🚀 CLI tool for secret management
- 🔍 Security scanning and vulnerability detection

## Installation

```bash
pnpm add @locumtruerate/secrets
```

## Quick Start

### Initialize Secrets

```bash
# Create .env.example file
pnpm secrets init

# Copy and configure
cp .env.example .env
```

### Using the Library

```typescript
import { SecretsManager, EnvSecretsProvider } from '@locumtruerate/secrets';

// Create manager
const provider = new EnvSecretsProvider();
const secrets = new SecretsManager({
  provider: 'env',
  encryption: {
    algorithm: 'AES-256-GCM',
    keyDerivation: 'PBKDF2',
    masterKeySource: 'env'
  }
}, provider);

// Get secret
const apiKey = await secrets.get('STRIPE_SECRET_KEY');

// Set secret
await secrets.set('NEW_API_KEY', 'secret_value');

// Validate all secrets
const validation = await secrets.validateAll();
if (!validation.valid) {
  console.error('Invalid secrets:', validation.errors);
}
```

## CLI Commands

```bash
# Initialize secrets configuration
pnpm secrets init

# Validate all secrets
pnpm secrets validate

# Generate secure secrets
pnpm secrets generate api-key
pnpm secrets generate jwt
pnpm secrets generate encryption
pnpm secrets generate password

# Manage secrets
pnpm secrets set API_KEY "your_secret_value"
pnpm secrets get API_KEY --reveal
pnpm secrets list
pnpm secrets delete API_KEY

# Rotate secrets
pnpm secrets rotate JWT_SECRET
pnpm secrets rotate-all

# Security checks
pnpm secrets check
pnpm secrets audit

# Export/Import
pnpm secrets export --file .env.backup
pnpm secrets import --file .env.backup
```

## Providers

### Environment Variables (Default)

```typescript
import { EnvSecretsProvider } from '@locumtruerate/secrets';

const provider = new EnvSecretsProvider({
  prefix: 'LTR_',
  envFile: '.env.production'
});
```

### Cloudflare KV (Edge Deployment)

```typescript
import { CloudflareSecretsProvider } from '@locumtruerate/secrets';

const provider = new CloudflareSecretsProvider({
  namespace: env.SECRETS_KV,
  prefix: 'secrets:'
});
```

## Secret Rotation

```typescript
import { SecretRotator } from '@locumtruerate/secrets';

const rotator = new SecretRotator(secrets, {
  enabled: true,
  autoRotate: true,
  defaultRotationDays: 90,
  notificationDays: 7,
  policies: {
    'API_KEY': { rotationDays: 30, notificationDays: 5 },
    'JWT_SECRET': { rotationDays: 60, notificationDays: 7 },
    'DATABASE_URL': { rotationDays: 180, notificationDays: 14 }
  }
});

// Listen for rotation events
rotator.on('rotation:completed', (result) => {
  console.log(`Secret ${result.secretName} rotated successfully`);
});

rotator.on('rotation:failed', (result) => {
  console.error(`Failed to rotate ${result.secretName}:`, result.error);
});
```

## Validation Rules

Define custom validation rules for different secret types:

```typescript
import { SecretsValidator } from '@locumtruerate/secrets';

const rules = {
  'API_KEY': {
    pattern: /^[A-Za-z0-9]{32,}$/,
    minLength: 32,
    message: 'API key must be at least 32 alphanumeric characters'
  },
  'DATABASE_URL': {
    pattern: /^postgres(ql)?:\/\/.+$/,
    message: 'Database URL must be a valid PostgreSQL connection string'
  },
  'EMAIL': {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Must be a valid email address'
  }
};

SecretsValidator.addRules(rules);
```

## Security Best Practices

1. **Master Key Management**
   - Store master key in secure environment variable
   - Rotate master key regularly
   - Use hardware security modules (HSM) in production

2. **Access Control**
   - Limit secret access to necessary services only
   - Use principle of least privilege
   - Implement audit logging for all access

3. **Rotation Policy**
   - Rotate API keys every 30 days
   - Rotate JWT secrets every 60 days
   - Rotate database credentials every 180 days

4. **Monitoring**
   - Set up alerts for failed validations
   - Monitor rotation failures
   - Track unauthorized access attempts

## HIPAA Compliance

This package includes features to support HIPAA compliance:

- Encryption at rest using AES-256-GCM
- Audit logging for all secret access
- Automatic rotation policies
- Access control and authentication
- Secure key derivation (PBKDF2/SCRYPT)

## API Reference

### SecretsManager

```typescript
class SecretsManager {
  get(name: string): Promise<string | null>
  set(name: string, value: string, metadata?: any): Promise<void>
  delete(name: string): Promise<void>
  exists(name: string): Promise<boolean>
  list(prefix?: string): Promise<string[]>
  rotate(name: string): Promise<SecretRotationResult>
  validateAll(): Promise<ValidationResult>
  exportSecrets(names: string[]): Promise<ExportedSecrets>
  importSecrets(data: ExportedSecrets): Promise<void>
}
```

### Encryption

```typescript
class Encryption {
  encrypt(value: string): Promise<string>
  decrypt(encrypted: string): Promise<string>
  static generateKey(): string
  static deriveKey(password: string, salt: string): Promise<Buffer>
}
```

### Validators

```typescript
class SecretsValidator {
  static validate(name: string, value: string): ValidationResult
  static validateAll(secrets: Record<string, string>): ValidationResult
  static generateSecureSecret(length: number, options?: GenerateOptions): string
  static checkComplexity(value: string): ComplexityResult
}
```

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

MIT