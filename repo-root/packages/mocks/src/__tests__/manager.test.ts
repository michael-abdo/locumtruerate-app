/**
 * Mock Server Manager Tests
 */

import { MockServerManager } from '../manager';

describe('MockServerManager', () => {
  let manager: MockServerManager;

  beforeEach(() => {
    manager = new MockServerManager();
  });

  afterEach(async () => {
    await manager.cleanup();
  });

  describe('initialization', () => {
    it('should initialize with empty configuration', async () => {
      await manager.initialize();
      expect(manager.isRunning()).toBe(false);
      expect(Object.keys(manager.getUrls())).toHaveLength(0);
    });

    it('should initialize with default configuration', async () => {
      const config = MockServerManager.createDefaultConfig();
      manager = new MockServerManager(config);
      await manager.initialize();

      const urls = manager.getUrls();
      expect(urls.stripe).toContain('localhost:4242');
      expect(urls.zapier).toContain('localhost:4243');
      expect(urls.email).toContain('localhost:4244');
    });
  });

  describe('server management', () => {
    beforeEach(async () => {
      const config = MockServerManager.createDefaultConfig();
      config.startAll = false; // Don't auto-start
      manager = new MockServerManager(config);
      await manager.initialize();
    });

    it('should start and stop all servers', async () => {
      expect(manager.isRunning()).toBe(false);

      await manager.startAll();
      expect(manager.isRunning()).toBe(true);

      await manager.stopAll();
      expect(manager.isRunning()).toBe(false);
    });

    it('should start and stop individual servers', async () => {
      await manager.start('stripe');
      const stripeServer = manager.getServer('stripe');
      expect(stripeServer).toBeDefined();

      await manager.stop('stripe');
      // Server should still exist but be stopped
      expect(manager.getServer('stripe')).toBeDefined();
    });

    it('should handle starting non-existent servers', async () => {
      await expect(manager.start('nonexistent')).rejects.toThrow();
    });

    it('should handle stopping non-existent servers', async () => {
      await expect(manager.stop('nonexistent')).rejects.toThrow();
    });
  });

  describe('server access', () => {
    beforeEach(async () => {
      const config = MockServerManager.createDefaultConfig();
      config.startAll = false;
      manager = new MockServerManager(config);
      await manager.initialize();
    });

    it('should provide access to server instances', () => {
      const stripeServer = manager.getServer('stripe');
      expect(stripeServer).toBeDefined();
      expect(stripeServer?.url).toContain('localhost:4242');
    });

    it('should return undefined for non-existent servers', () => {
      const server = manager.getServer('nonexistent');
      expect(server).toBeUndefined();
    });

    it('should provide server URLs', () => {
      const urls = manager.getUrls();
      expect(urls.stripe).toBeDefined();
      expect(urls.zapier).toBeDefined();
      expect(urls.email).toBeDefined();
    });
  });

  describe('data management', () => {
    beforeEach(async () => {
      const config = MockServerManager.createDefaultConfig();
      config.startAll = false;
      manager = new MockServerManager(config);
      await manager.initialize();
    });

    it('should reset all server data', () => {
      // This should not throw
      expect(() => manager.resetAllData()).not.toThrow();
    });
  });

  describe('status reporting', () => {
    beforeEach(async () => {
      const config = MockServerManager.createDefaultConfig();
      config.startAll = false;
      manager = new MockServerManager(config);
      await manager.initialize();
    });

    it('should print status without errors', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      manager.printStatus();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});