/**
 * Secret Rotator
 * Automated secret rotation with notifications
 */

import { EventEmitter } from 'events';
import { SecretsManager } from './manager';
import type { SecretRotationPolicy, SecretRotationResult } from './types';

export class SecretRotator extends EventEmitter {
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();
  private rotationHistory: SecretRotationResult[] = [];

  constructor(
    private manager: SecretsManager,
    private policy: SecretRotationPolicy
  ) {
    super();
    
    if (policy.enabled && policy.autoRotate) {
      this.startAutoRotation();
    }
  }

  /**
   * Start automatic rotation
   */
  startAutoRotation(): void {
    console.log('🔄 Starting automatic secret rotation...');
    
    // Schedule rotation checks every hour
    setInterval(() => {
      this.checkRotationNeeded();
    }, 60 * 60 * 1000); // 1 hour
    
    // Initial check
    this.checkRotationNeeded();
  }

  /**
   * Check which secrets need rotation
   */
  async checkRotationNeeded(): Promise<void> {
    const secrets = await this.manager.list();
    
    for (const secretName of secrets) {
      const needsRotation = await this.shouldRotate(secretName);
      
      if (needsRotation) {
        this.emit('rotation:needed', { secretName });
        
        if (this.policy.autoRotate) {
          await this.rotateSecret(secretName);
        }
      }
    }
  }

  /**
   * Check if a secret should be rotated
   */
  async shouldRotate(secretName: string): Promise<boolean> {
    // Get secret metadata
    const metadata = await this.getSecretMetadata(secretName);
    
    if (!metadata || !metadata.lastRotated) {
      // Never rotated, should rotate
      return true;
    }
    
    // Get rotation policy for secret type
    const secretType = this.getSecretType(secretName);
    const typePolicy = this.policy.policies[secretType];
    const rotationDays = typePolicy?.rotationDays || this.policy.defaultRotationDays;
    
    // Calculate days since last rotation
    const daysSinceRotation = (Date.now() - new Date(metadata.lastRotated).getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceRotation >= rotationDays;
  }

  /**
   * Rotate a specific secret
   */
  async rotateSecret(secretName: string): Promise<SecretRotationResult> {
    console.log(`🔄 Rotating secret: ${secretName}`);
    
    try {
      // Notify before rotation
      await this.notifyBeforeRotation(secretName);
      
      // Perform rotation
      const result = await this.manager.rotate(secretName);
      
      // Record in history
      this.rotationHistory.push(result);
      
      // Notify after rotation
      await this.notifyAfterRotation(result);
      
      // Schedule next rotation
      this.scheduleNextRotation(secretName);
      
      this.emit('rotation:completed', result);
      
      return result;
      
    } catch (error) {
      const result: SecretRotationResult = {
        secretName,
        oldVersion: 0,
        newVersion: 0,
        rotatedAt: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationsSent: []
      };
      
      this.emit('rotation:failed', result);
      
      return result;
    }
  }

  /**
   * Schedule next rotation for a secret
   */
  private scheduleNextRotation(secretName: string): void {
    // Clear existing timer
    const existingTimer = this.rotationTimers.get(secretName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Get rotation interval
    const secretType = this.getSecretType(secretName);
    const typePolicy = this.policy.policies[secretType];
    const rotationDays = typePolicy?.rotationDays || this.policy.defaultRotationDays;
    
    // Schedule rotation
    const timer = setTimeout(() => {
      this.rotateSecret(secretName);
    }, rotationDays * 24 * 60 * 60 * 1000);
    
    this.rotationTimers.set(secretName, timer);
  }

  /**
   * Notify before rotation
   */
  private async notifyBeforeRotation(secretName: string): Promise<void> {
    const secretType = this.getSecretType(secretName);
    const typePolicy = this.policy.policies[secretType];
    const notificationDays = typePolicy?.notificationDays || this.policy.notificationDays;
    
    this.emit('rotation:warning', {
      secretName,
      message: `Secret ${secretName} will be rotated in ${notificationDays} days`,
      rotationDate: new Date(Date.now() + notificationDays * 24 * 60 * 60 * 1000)
    });
  }

  /**
   * Notify after rotation
   */
  private async notifyAfterRotation(result: SecretRotationResult): Promise<void> {
    if (result.success) {
      this.emit('rotation:success', {
        secretName: result.secretName,
        message: `Secret ${result.secretName} has been successfully rotated`,
        newVersion: result.newVersion
      });
    } else {
      this.emit('rotation:error', {
        secretName: result.secretName,
        message: `Failed to rotate secret ${result.secretName}: ${result.error}`,
        error: result.error
      });
    }
  }

  /**
   * Get secret metadata (mock implementation)
   */
  private async getSecretMetadata(secretName: string): Promise<any> {
    // In production, this would fetch actual metadata
    return {
      lastRotated: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
    };
  }

  /**
   * Get secret type from name
   */
  private getSecretType(name: string): any {
    if (name.includes('API_KEY')) return 'API_KEY';
    if (name.includes('DATABASE')) return 'DATABASE_URL';
    if (name.includes('JWT')) return 'JWT_SECRET';
    if (name.includes('WEBHOOK')) return 'WEBHOOK_SECRET';
    return 'API_KEY'; // Default
  }

  /**
   * Get rotation history
   */
  getRotationHistory(limit: number = 100): SecretRotationResult[] {
    return this.rotationHistory.slice(-limit);
  }

  /**
   * Get next rotation schedule
   */
  getRotationSchedule(): Array<{ secretName: string; nextRotation: Date }> {
    const schedule: Array<{ secretName: string; nextRotation: Date }> = [];
    
    this.rotationTimers.forEach((timer, secretName) => {
      // This is a simplified implementation
      // In production, store actual rotation dates
      const secretType = this.getSecretType(secretName);
      const typePolicy = this.policy.policies[secretType];
      const rotationDays = typePolicy?.rotationDays || this.policy.defaultRotationDays;
      
      schedule.push({
        secretName,
        nextRotation: new Date(Date.now() + rotationDays * 24 * 60 * 60 * 1000)
      });
    });
    
    return schedule;
  }

  /**
   * Force rotation of all secrets
   */
  async rotateAll(): Promise<SecretRotationResult[]> {
    console.log('🔄 Rotating all secrets...');
    
    const secrets = await this.manager.list();
    const results: SecretRotationResult[] = [];
    
    for (const secretName of secrets) {
      const result = await this.rotateSecret(secretName);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Stop auto rotation
   */
  stopAutoRotation(): void {
    // Clear all timers
    this.rotationTimers.forEach(timer => clearTimeout(timer));
    this.rotationTimers.clear();
    
    console.log('⏹️ Automatic rotation stopped');
  }

  /**
   * Validate rotation policy
   */
  static validatePolicy(policy: SecretRotationPolicy): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (policy.defaultRotationDays < 1) {
      errors.push('Default rotation days must be at least 1');
    }
    
    if (policy.notificationDays < 0) {
      errors.push('Notification days cannot be negative');
    }
    
    if (policy.notificationDays >= policy.defaultRotationDays) {
      errors.push('Notification days must be less than rotation days');
    }
    
    // Validate type-specific policies
    for (const [type, typePolicy] of Object.entries(policy.policies)) {
      if (typePolicy.rotationDays < 1) {
        errors.push(`${type} rotation days must be at least 1`);
      }
      
      if (typePolicy.notificationDays >= typePolicy.rotationDays) {
        errors.push(`${type} notification days must be less than rotation days`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}