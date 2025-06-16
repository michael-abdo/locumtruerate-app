/**
 * Cross-platform logging utility
 * Works in Node.js, browser, and React Native environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  sessionId?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private context: LogContext = {};
  
  private constructor() {
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL || process.env.NEXT_PUBLIC_LOG_LEVEL;
    if (envLevel && envLevel in LogLevel) {
      this.logLevel = LogLevel[envLevel as keyof typeof LogLevel];
    }
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }
  
  clearContext() {
    this.context = {};
  }
  
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }
  
  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }
  
  private formatMessage(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level];
    const contextStr = Object.keys(entry.context || {}).length > 0
      ? ` [${JSON.stringify(entry.context)}]`
      : '';
    
    return `[${entry.timestamp}] ${levelStr}${contextStr}: ${entry.message}`;
  }
  
  private createEntry(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.context },
      data,
      error,
    };
  }
  
  private log(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) {
      return;
    }
    
    const formattedMessage = this.formatMessage(entry);
    
    // Console logging
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, entry.error || entry.data);
        break;
    }
    
    // Send to external service in production
    if (process.env.NODE_ENV === 'production' && entry.level >= LogLevel.WARN) {
      this.sendToLoggingService(entry);
    }
  }
  
  private async sendToLoggingService(entry: LogEntry) {
    // In production, this would send to Sentry, LogRocket, etc.
    // For now, we'll just structure the data properly
    const payload = {
      level: LogLevel[entry.level],
      message: entry.message,
      timestamp: entry.timestamp,
      context: entry.context,
      data: entry.data,
      error: entry.error ? {
        message: entry.error.message,
        stack: entry.error.stack,
        name: entry.error.name,
      } : undefined,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        platform: typeof window !== 'undefined' ? 'browser' : 'node',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      },
    };
    
    // TODO: Send to actual logging service
    // await fetch('/api/logs', { method: 'POST', body: JSON.stringify(payload) });
  }
  
  debug(message: string, data?: any) {
    this.log(this.createEntry(LogLevel.DEBUG, message, data));
  }
  
  info(message: string, data?: any) {
    this.log(this.createEntry(LogLevel.INFO, message, data));
  }
  
  warn(message: string, data?: any) {
    this.log(this.createEntry(LogLevel.WARN, message, data));
  }
  
  error(message: string, error?: Error, data?: any) {
    this.log(this.createEntry(LogLevel.ERROR, message, data, error));
  }
  
  fatal(message: string, error?: Error, data?: any) {
    this.log(this.createEntry(LogLevel.FATAL, message, data, error));
  }
  
  // Structured logging methods
  logHttpRequest(method: string, url: string, statusCode: number, duration: number) {
    this.info(`HTTP ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
      type: 'http_request',
    });
  }
  
  logDatabaseQuery(query: string, duration: number, success: boolean) {
    const level = success ? LogLevel.DEBUG : LogLevel.ERROR;
    this.log(this.createEntry(level, 'Database query', {
      query: process.env.NODE_ENV === 'development' ? query : '[REDACTED]',
      duration,
      success,
      type: 'database_query',
    }));
  }
  
  logBusinessEvent(event: string, data?: any) {
    this.info(`Business event: ${event}`, {
      ...data,
      type: 'business_event',
      event,
    });
  }
  
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', data?: any) {
    const level = severity === 'high' ? LogLevel.ERROR : LogLevel.WARN;
    this.log(this.createEntry(level, `Security event: ${event}`, {
      ...data,
      type: 'security_event',
      event,
      severity,
    }));
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const { debug, info, warn, error, fatal } = logger;

// React Native specific logger
export class ReactNativeLogger {
  static log(...args: any[]) {
    if (__DEV__) {
      console.log(...args);
    }
  }
  
  static warn(...args: any[]) {
    if (__DEV__) {
      console.warn(...args);
    }
  }
  
  static error(...args: any[]) {
    console.error(...args);
    // Send to crash reporting in production
  }
}

// Performance logging
export class PerformanceLogger {
  private static marks = new Map<string, number>();
  
  static mark(name: string) {
    this.marks.set(name, performance.now());
  }
  
  static measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    if (!start) {
      logger.warn(`Performance mark ${startMark} not found`);
      return;
    }
    
    const end = endMark ? this.marks.get(endMark) : performance.now();
    if (!end) {
      logger.warn(`Performance mark ${endMark} not found`);
      return;
    }
    
    const duration = end - start;
    logger.info(`Performance: ${name}`, {
      duration,
      startMark,
      endMark,
      type: 'performance',
    });
    
    return duration;
  }
  
  static clearMarks() {
    this.marks.clear();
  }
}