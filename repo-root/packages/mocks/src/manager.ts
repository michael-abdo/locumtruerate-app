/**
 * Mock Server Manager
 * Manages multiple mock servers for coordinated testing
 */

import type { 
  MockServerInstance, 
  StripeMockConfig, 
  ZapierMockConfig, 
  EmailMockConfig 
} from './types';
import { StripeMockServer } from './stripe';
import { ZapierMockServer } from './zapier';
import { EmailMockServer } from './email';

export interface MockManagerConfig {
  stripe?: StripeMockConfig;
  zapier?: ZapierMockConfig;
  email?: EmailMockConfig;
  startAll?: boolean;
}

export class MockServerManager {
  private servers: Map<string, MockServerInstance> = new Map();
  private running = false;

  constructor(private config: MockManagerConfig = {}) {}

  /**
   * Initialize all configured mock servers
   */
  async initialize(): Promise<void> {
    if (this.config.stripe) {
      const stripeServer = new StripeMockServer(this.config.stripe);
      this.servers.set('stripe', stripeServer);
    }

    if (this.config.zapier) {
      const zapierServer = new ZapierMockServer(this.config.zapier);
      this.servers.set('zapier', zapierServer);
    }

    if (this.config.email) {
      const emailServer = new EmailMockServer(this.config.email);
      this.servers.set('email', emailServer);
    }

    if (this.config.startAll) {
      await this.startAll();
    }
  }

  /**
   * Start all mock servers
   */
  async startAll(): Promise<void> {
    if (this.running) {
      console.log('🎭 Mock servers already running');
      return;
    }

    console.log('🎭 Starting all mock servers...');
    
    const startPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        await server.start();
        console.log(`✅ ${name} mock server started`);
      } catch (error) {
        console.error(`❌ Failed to start ${name} mock server:`, error);
        throw error;
      }
    });

    await Promise.all(startPromises);
    this.running = true;
    
    console.log('🎉 All mock servers started successfully!');
    this.printStatus();
  }

  /**
   * Stop all mock servers
   */
  async stopAll(): Promise<void> {
    if (!this.running) {
      console.log('🎭 Mock servers not running');
      return;
    }

    console.log('🎭 Stopping all mock servers...');
    
    const stopPromises = Array.from(this.servers.entries()).map(async ([name, server]) => {
      try {
        await server.stop();
        console.log(`✅ ${name} mock server stopped`);
      } catch (error) {
        console.error(`❌ Failed to stop ${name} mock server:`, error);
      }
    });

    await Promise.all(stopPromises);
    this.running = false;
    
    console.log('🛑 All mock servers stopped');
  }

  /**
   * Start a specific mock server
   */
  async start(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Mock server '${serverName}' not found`);
    }

    await server.start();
    console.log(`✅ ${serverName} mock server started`);
  }

  /**
   * Stop a specific mock server
   */
  async stop(serverName: string): Promise<void> {
    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Mock server '${serverName}' not found`);
    }

    await server.stop();
    console.log(`✅ ${serverName} mock server stopped`);
  }

  /**
   * Get a specific mock server instance
   */
  getServer<T extends MockServerInstance>(serverName: string): T | undefined {
    return this.servers.get(serverName) as T;
  }

  /**
   * Check if servers are running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get server URLs
   */
  getUrls(): Record<string, string> {
    const urls: Record<string, string> = {};
    this.servers.forEach((server, name) => {
      urls[name] = server.url;
    });
    return urls;
  }

  /**
   * Print status of all servers
   */
  printStatus(): void {
    console.log('\n📊 Mock Server Status:');
    console.log('─'.repeat(50));
    
    if (this.servers.size === 0) {
      console.log('No mock servers configured');
      return;
    }

    this.servers.forEach((server, name) => {
      const status = this.running ? '🟢 Running' : '🔴 Stopped';
      console.log(`${status} ${name.padEnd(15)} ${server.url}`);
    });
    
    console.log('─'.repeat(50));
    console.log(`Total servers: ${this.servers.size}`);
    console.log('');
  }

  /**
   * Create a default configuration for testing
   */
  static createDefaultConfig(): MockManagerConfig {
    return {
      stripe: {
        port: 4242,
        host: 'localhost',
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:3001'],
          credentials: true
        },
        webhookEndpoint: '/webhooks/stripe',
        defaultCurrency: 'usd'
      },
      zapier: {
        port: 4243,
        host: 'localhost',
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:3001'],
          credentials: true
        },
        webhookSecret: 'test_webhook_secret',
        enableAuth: false
      },
      email: {
        port: 4244,
        host: 'localhost',
        cors: {
          origin: ['http://localhost:3000', 'http://localhost:3001'],
          credentials: true
        },
        smtpPort: 1026,
        enableSMTP: false
      },
      startAll: false
    };
  }

  /**
   * Cleanup resources and stop all servers
   */
  async cleanup(): Promise<void> {
    await this.stopAll();
    this.servers.clear();
  }

  /**
   * Reset all server data (useful for test cleanup)
   */
  resetAllData(): void {
    this.servers.forEach((server, name) => {
      if (name === 'stripe' && 'clearData' in server) {
        (server as any).clearData();
      } else if (name === 'email' && 'clearEmails' in server) {
        (server as any).clearEmails();
      } else if (name === 'zapier' && 'clearWebhooks' in server) {
        (server as any).clearWebhooks();
      }
    });
    console.log('🧹 All mock server data cleared');
  }
}