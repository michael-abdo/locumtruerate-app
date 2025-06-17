/**
 * Secrets Management Type Definitions
 */

export type SecretType = 
  | 'API_KEY'
  | 'DATABASE_URL'
  | 'JWT_SECRET'
  | 'ENCRYPTION_KEY'
  | 'OAUTH_SECRET'
  | 'WEBHOOK_SECRET'
  | 'SERVICE_ACCOUNT'
  | 'CERTIFICATE'
  | 'PRIVATE_KEY';

export interface Secret {
  id: string;
  name: string;
  type: SecretType;
  value: string;
  encrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  rotateAfterDays?: number;
  lastRotated?: Date;
  version: number;
  tags?: string[];
  description?: string;
}

export interface SecretsConfig {
  provider: 'cloudflare' | 'env' | 'vault' | 'aws-secrets-manager';
  encryption: EncryptionConfig;
  rotation?: SecretRotationPolicy;
  validation?: SecretValidation;
  cloudflare?: {
    accountId: string;
    apiToken: string;
    kvNamespace?: string;
  };
  vault?: {
    address: string;
    token: string;
    path: string;
  };
  aws?: {
    region: string;
    secretsManagerPrefix: string;
  };
}

export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'AES-256-CBC';
  keyDerivation: 'PBKDF2' | 'SCRYPT';
  masterKeySource: 'env' | 'file' | 'kms';
  masterKey?: string;
  saltRounds?: number;
}

export interface SecretRotationPolicy {
  enabled: boolean;
  defaultRotationDays: number;
  notificationDays: number;
  autoRotate: boolean;
  policies: {
    [key in SecretType]?: {
      rotationDays: number;
      notificationDays: number;
      validator?: (value: string) => boolean;
    };
  };
}

export interface SecretValidation {
  enforceComplexity: boolean;
  minLength: number;
  requireSpecialChars: boolean;
  requireNumbers: boolean;
  requireUppercase: boolean;
  customValidators?: {
    [key: string]: (value: string) => boolean | string;
  };
}

export interface SecretProvider {
  get(name: string): Promise<string | null>;
  set(name: string, value: string, metadata?: any): Promise<void>;
  delete(name: string): Promise<void>;
  list(prefix?: string): Promise<string[]>;
  exists(name: string): Promise<boolean>;
  rotate?(name: string): Promise<string>;
}

export interface ServiceSecrets {
  // Cloudflare R2
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  };

  // Database (Neon PostgreSQL)
  database: {
    url: string;
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl: boolean;
    poolMin?: number;
    poolMax?: number;
  };

  // Clerk Authentication
  clerk: {
    publishableKey: string;
    secretKey: string;
    webhookSecret?: string;
    jwtKey?: string;
  };

  // Stripe Payments
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    priceIds?: {
      basic: string;
      professional: string;
      enterprise: string;
    };
  };

  // Email Services (SendGrid)
  email: {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    webhookSecret?: string;
    templates?: {
      welcome: string;
      passwordReset: string;
      jobAlert: string;
      applicationStatus: string;
    };
  };

  // Sentry Monitoring
  sentry?: {
    dsn: string;
    environment: string;
    release?: string;
  };

  // Analytics
  analytics?: {
    googleAnalyticsId?: string;
    mixpanelToken?: string;
    amplitudeApiKey?: string;
  };

  // API Keys
  apiKeys?: {
    internal: string;
    public?: string;
    admin?: string;
  };

  // JWT Configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret?: string;
    refreshExpiresIn?: string;
  };

  // Encryption Keys
  encryption: {
    masterKey: string;
    dataKey?: string;
    backupKey?: string;
  };
}

export interface SecretRotationResult {
  secretName: string;
  oldVersion: number;
  newVersion: number;
  rotatedAt: Date;
  success: boolean;
  error?: string;
  notificationsSent: string[];
}

export interface SecretAuditLog {
  id: string;
  timestamp: Date;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'ROTATE';
  secretName: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface HealthcareComplianceSecrets {
  // HIPAA Compliance
  hipaa: {
    encryptionKey: string;
    auditLogKey: string;
    dataRetentionKey: string;
  };

  // Medical API Integrations
  medicalApis?: {
    npiRegistry?: {
      apiKey: string;
    };
    drugDatabase?: {
      apiKey: string;
      clientId: string;
    };
    insuranceVerification?: {
      username: string;
      password: string;
    };
  };
}

export interface SecretMetadata {
  createdBy?: string;
  lastModifiedBy?: string;
  environment: 'development' | 'staging' | 'production';
  service: string;
  compliance?: {
    hipaa: boolean;
    pci: boolean;
    sox: boolean;
  };
  tags?: string[];
  notes?: string;
}