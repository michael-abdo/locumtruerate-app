/**
 * Secrets Management Package Entry Point
 * Secure handling of API keys, credentials, and sensitive configuration
 */

export { SecretsManager } from './manager';
export { SecretsValidator } from './validators';
export { Encryption } from './encryption';
export { SecretRotator } from './rotator';
export { CloudflareSecretsProvider } from './providers/cloudflare';
export { EnvSecretsProvider } from './providers/env';

// Re-export types
export type {
  Secret,
  SecretType,
  SecretsConfig,
  SecretProvider,
  EncryptionConfig,
  SecretRotationPolicy,
  SecretValidation,
  ServiceSecrets
} from './types';