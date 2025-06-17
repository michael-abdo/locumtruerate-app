/**
 * Jest setup for mock services
 */

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  async waitForPort(port, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) return true;
      } catch (error) {
        // Port not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error(`Port ${port} not ready within ${timeout}ms`);
  },

  getRandomPort() {
    return Math.floor(Math.random() * 10000) + 20000;
  }
};

// Cleanup function for tests
afterEach(async () => {
  // Reset any global state if needed
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});