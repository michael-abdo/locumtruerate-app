/**
 * Cloudflare KV Secret Provider
 * Stores secrets in Cloudflare Workers KV for edge deployment
 */

import type { SecretProvider } from '../types';

interface CloudflareKVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { metadata?: any }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

export class CloudflareSecretsProvider implements SecretProvider {
  private kv: CloudflareKVNamespace;
  private prefix: string;

  constructor(options: {
    namespace: CloudflareKVNamespace;
    prefix?: string;
  }) {
    this.kv = options.namespace;
    this.prefix = options.prefix || 'secrets:';
  }

  /**
   * Get secret from KV
   */
  async get(name: string): Promise<string | null> {
    const key = this.getKey(name);
    return this.kv.get(key);
  }

  /**
   * Set secret in KV
   */
  async set(name: string, value: string, metadata?: any): Promise<void> {
    const key = this.getKey(name);
    await this.kv.put(key, value, { metadata });
  }

  /**
   * Delete secret from KV
   */
  async delete(name: string): Promise<void> {
    const key = this.getKey(name);
    await this.kv.delete(key);
  }

  /**
   * List all secrets
   */
  async list(prefix?: string): Promise<string[]> {
    const searchPrefix = this.prefix + (prefix || '');
    const result = await this.kv.list({ prefix: searchPrefix });
    
    return result.keys.map(key => 
      key.name.substring(this.prefix.length)
    );
  }

  /**
   * Check if secret exists
   */
  async exists(name: string): Promise<boolean> {
    const value = await this.get(name);
    return value !== null;
  }

  /**
   * Rotate a secret (Cloudflare-specific implementation)
   */
  async rotate(name: string): Promise<string> {
    // Get current value with metadata
    const key = this.getKey(name);
    const current = await this.kv.get(key);
    
    if (!current) {
      throw new Error(`Secret ${name} not found`);
    }

    // Generate new value (simplified - in practice, use proper generation)
    const newValue = this.generateNewSecret();
    
    // Store old version with timestamp
    const backupKey = `${key}:backup:${Date.now()}`;
    await this.kv.put(backupKey, current);
    
    // Update with new value
    await this.set(name, newValue, {
      rotatedAt: new Date().toISOString(),
      previousBackup: backupKey
    });
    
    return newValue;
  }

  /**
   * Get key with prefix
   */
  private getKey(name: string): string {
    return this.prefix + name;
  }

  /**
   * Generate new secret value
   */
  private generateNewSecret(): string {
    // In production, use crypto.getRandomValues() in Workers
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Bulk operations for efficiency
   */
  async bulkSet(secrets: Array<{ name: string; value: string; metadata?: any }>): Promise<void> {
    // KV doesn't support bulk writes natively, but we can use Promise.all
    await Promise.all(
      secrets.map(secret => 
        this.set(secret.name, secret.value, secret.metadata)
      )
    );
  }

  /**
   * Bulk get for efficiency
   */
  async bulkGet(names: string[]): Promise<Record<string, string | null>> {
    const results = await Promise.all(
      names.map(async name => ({
        name,
        value: await this.get(name)
      }))
    );
    
    return results.reduce((acc, { name, value }) => {
      acc[name] = value;
      return acc;
    }, {} as Record<string, string | null>);
  }

  /**
   * Export all secrets (for backup)
   */
  async exportAll(): Promise<Array<{ name: string; value: string }>> {
    const names = await this.list();
    const exports: Array<{ name: string; value: string }> = [];
    
    for (const name of names) {
      const value = await this.get(name);
      if (value) {
        exports.push({ name, value });
      }
    }
    
    return exports;
  }

  /**
   * Import secrets (for restore)
   */
  async importAll(secrets: Array<{ name: string; value: string }>): Promise<void> {
    await this.bulkSet(secrets);
  }

  /**
   * Clean up old backup keys
   */
  async cleanupBackups(olderThanDays: number = 30): Promise<number> {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    const backupPrefix = this.prefix + ':backup:';
    const backups = await this.kv.list({ prefix: backupPrefix });
    
    let deleted = 0;
    for (const key of backups.keys) {
      const timestamp = parseInt(key.name.split(':').pop() || '0');
      if (timestamp < cutoffTime) {
        await this.kv.delete(key.name);
        deleted++;
      }
    }
    
    return deleted;
  }
}

/**
 * Factory function for creating Cloudflare provider in Workers environment
 */
export function createCloudflareProvider(env: any): CloudflareSecretsProvider {
  // In Workers, KV namespace is available on env
  if (!env.SECRETS_KV) {
    throw new Error('SECRETS_KV namespace not bound to Worker');
  }
  
  return new CloudflareSecretsProvider({
    namespace: env.SECRETS_KV,
    prefix: env.SECRETS_PREFIX || 'secrets:'
  });
}