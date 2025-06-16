/**
 * Tests for logger utilities
 */

import { logger, createLogger, LogLevel } from '../logger';

// Mock console methods
const mockConsole = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Mock JSON.stringify to control output
const originalStringify = JSON.stringify;

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Replace console methods
    global.console = mockConsole as any;
    
    // Reset environment
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    // Restore JSON.stringify
    global.JSON.stringify = originalStringify;
  });

  describe('Log Levels', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      const testLogger = createLogger();
      
      testLogger.debug('Debug message', { test: true });
      
      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG'),
        expect.stringContaining('Debug message'),
        expect.stringContaining('"test":true')
      );
    });

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production';
      const testLogger = createLogger();
      
      testLogger.debug('Debug message');
      
      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should always log error messages', () => {
      process.env.NODE_ENV = 'production';
      const testLogger = createLogger();
      
      testLogger.error('Error message');
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR'),
        expect.stringContaining('Error message')
      );
    });

    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'warn';
      const testLogger = createLogger();
      
      testLogger.info('Info message');
      testLogger.warn('Warn message');
      
      expect(mockConsole.info).not.toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
    });
  });

  describe('Message Formatting', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should format simple string messages', () => {
      const testLogger = createLogger();
      
      testLogger.info('Simple message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        'INFO',
        'Simple message'
      );
    });

    it('should format messages with context', () => {
      const testLogger = createLogger();
      const context = { userId: '123', action: 'login' };
      
      testLogger.info('User action', context);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/),
        'INFO',
        'User action',
        '{"userId":"123","action":"login"}'
      );
    });

    it('should format error objects', () => {
      const testLogger = createLogger();
      const error = new Error('Test error');
      error.stack = 'Error: Test error\n    at test.js:1:1';
      
      testLogger.error('Error occurred', error);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.any(String),
        'ERROR',
        'Error occurred',
        expect.stringContaining('"name":"Error"'),
        expect.stringContaining('"message":"Test error"'),
        expect.stringContaining('"stack":"Error: Test error')
      );
    });

    it('should handle context with both data and error', () => {
      const testLogger = createLogger();
      const error = new Error('Test error');
      const context = { userId: '123' };
      
      testLogger.error('Error with context', error, context);
      
      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.any(String),
        'ERROR',
        'Error with context',
        expect.stringContaining('"name":"Error"'),
        expect.stringContaining('"userId":"123"')
      );
    });
  });

  describe('Context Handling', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle undefined context gracefully', () => {
      const testLogger = createLogger();
      
      testLogger.info('Message', undefined);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Message'
      );
    });

    it('should handle null context gracefully', () => {
      const testLogger = createLogger();
      
      testLogger.info('Message', null);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Message'
      );
    });

    it('should handle empty object context', () => {
      const testLogger = createLogger();
      
      testLogger.info('Message', {});
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Message',
        '{}'
      );
    });

    it('should handle circular references in context', () => {
      const testLogger = createLogger();
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Mock JSON.stringify to throw on circular reference
      global.JSON.stringify = jest.fn().mockImplementation((obj) => {
        if (obj === circular) {
          throw new TypeError('Converting circular structure to JSON');
        }
        return originalStringify(obj);
      });
      
      testLogger.info('Message with circular reference', circular);
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Message with circular reference',
        '[Circular Reference]'
      );
    });
  });

  describe('Performance Logging', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should measure execution time', async () => {
      const testLogger = createLogger();
      
      const timer = testLogger.startTimer('test-operation');
      await new Promise(resolve => setTimeout(resolve, 10));
      timer.end('Operation completed');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Operation completed',
        expect.stringMatching(/"duration":\d+/)
      );
    });

    it('should handle timer end without message', () => {
      const testLogger = createLogger();
      
      const timer = testLogger.startTimer('test-operation');
      timer.end();
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'test-operation completed',
        expect.stringMatching(/"duration":\d+/)
      );
    });

    it('should include additional context in timer', () => {
      const testLogger = createLogger();
      const context = { userId: '123' };
      
      const timer = testLogger.startTimer('test-operation', context);
      timer.end('Operation done');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Operation done',
        expect.stringContaining('"userId":"123"'),
        expect.stringContaining('"duration":')
      );
    });
  });

  describe('Default Logger Instance', () => {
    it('should provide a default logger instance', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should work with default logger', () => {
      process.env.NODE_ENV = 'development';
      
      logger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Test message'
      );
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should handle very large context objects', () => {
      const testLogger = createLogger();
      const largeContext = {
        data: 'x'.repeat(10000),
        array: new Array(1000).fill('item'),
      };
      
      testLogger.info('Large context', largeContext);
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should handle special characters in messages', () => {
      const testLogger = createLogger();
      
      testLogger.info('Message with émojis 🚀 and spëcial chars');
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Message with émojis 🚀 and spëcial chars'
      );
    });

    it('should handle numeric and boolean contexts', () => {
      const testLogger = createLogger();
      
      testLogger.info('Mixed types', {
        number: 42,
        boolean: true,
        null: null,
        undefined: undefined,
      });
      
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.any(String),
        'INFO',
        'Mixed types',
        expect.stringContaining('"number":42'),
        expect.stringContaining('"boolean":true'),
        expect.stringContaining('"null":null')
      );
    });
  });

  describe('Log Level Validation', () => {
    it('should handle invalid log level gracefully', () => {
      process.env.LOG_LEVEL = 'invalid';
      
      expect(() => createLogger()).not.toThrow();
      
      const testLogger = createLogger();
      testLogger.info('Test message');
      
      expect(mockConsole.info).toHaveBeenCalled();
    });

    it('should handle uppercase log levels', () => {
      process.env.LOG_LEVEL = 'ERROR';
      const testLogger = createLogger();
      
      testLogger.warn('Warning message');
      testLogger.error('Error message');
      
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.error).toHaveBeenCalled();
    });
  });
});