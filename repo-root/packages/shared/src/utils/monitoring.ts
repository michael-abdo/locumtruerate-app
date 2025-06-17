/**
 * Application monitoring utilities
 * Integrates with Sentry and other monitoring services
 */

import { AppError } from '../errors';

export interface MonitoringConfig {
  sentryDsn?: string;
  environment: string;
  release?: string;
  tracesSampleRate: number;
  sessionTrackingEnabled: boolean;
}

export interface UserContext {
  id: string;
  email?: string;
  username?: string;
  organizationId?: string;
}

export interface Transaction {
  name: string;
  op: string;
  data?: Record<string, any>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;
  private config?: MonitoringConfig;
  
  private constructor() {}
  
  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }
  
  async initialize(config: MonitoringConfig) {
    if (this.initialized) {
      return;
    }
    
    this.config = config;
    
    // Initialize Sentry in production
    if (config.sentryDsn && process.env.NODE_ENV === 'production') {
      try {
        // Dynamic import for Sentry to avoid bundling in development
        const Sentry = await import('@sentry/node');
        
        Sentry.init({
          dsn: config.sentryDsn,
          environment: config.environment,
          release: config.release,
          tracesSampleRate: config.tracesSampleRate,
          integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            new Sentry.Integrations.Express({ app: true }),
          ],
          beforeSend(event, hint) {
            // Filter out non-operational errors
            if (hint.originalException instanceof AppError) {
              if (!hint.originalException.isOperational) {
                return event;
              }
              return null; // Don't send operational errors
            }
            return event;
          },
        });
        
        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize Sentry:', error);
      }
    }
  }
  
  setUserContext(user: UserContext) {
    if (!this.initialized) return;
    
    try {
      const Sentry = require('@sentry/node');
      Sentry.setUser(user);
    } catch (error) {
      // Sentry not available
    }
  }
  
  clearUserContext() {
    if (!this.initialized) return;
    
    try {
      const Sentry = require('@sentry/node');
      Sentry.setUser(null);
    } catch (error) {
      // Sentry not available
    }
  }
  
  captureException(error: Error, context?: Record<string, any>) {
    console.error('Captured exception:', error, context);
    
    if (!this.initialized) return;
    
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(error, {
        contexts: {
          custom: context,
        },
      });
    } catch (err) {
      // Sentry not available
    }
  }
  
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    if (!this.initialized) return;
    
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureMessage(message, level);
    } catch (error) {
      // Sentry not available
    }
  }
  
  startTransaction(transaction: Transaction) {
    if (!this.initialized) return null;
    
    try {
      const Sentry = require('@sentry/node');
      return Sentry.startTransaction({
        name: transaction.name,
        op: transaction.op,
        data: transaction.data,
      });
    } catch (error) {
      return null;
    }
  }
  
  addBreadcrumb(
    message: string,
    category: string,
    level: 'debug' | 'info' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ) {
    if (!this.initialized) return;
    
    try {
      const Sentry = require('@sentry/node');
      Sentry.addBreadcrumb({
        message,
        category,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      // Sentry not available
    }
  }
  
  // Custom metrics
  trackMetric(name: string, value: number, tags?: Record<string, string>) {
    // In production, send to metrics service (Datadog, CloudWatch, etc.)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implement actual metrics tracking
      console.log('Metric:', { name, value, tags });
    }
  }
  
  // Business metrics
  trackJobPosted(jobId: string, companyId: string, userId: string) {
    this.addBreadcrumb('Job posted', 'business', 'info', { jobId, companyId, userId });
    this.trackMetric('jobs.posted', 1, { companyId });
  }
  
  trackApplicationSubmitted(applicationId: string, jobId: string) {
    this.addBreadcrumb('Application submitted', 'business', 'info', { applicationId, jobId });
    this.trackMetric('applications.submitted', 1, { jobId });
  }
  
  trackPaymentProcessed(amount: number, currency: string, customerId: string) {
    this.addBreadcrumb('Payment processed', 'business', 'info', { amount, currency });
    this.trackMetric('payments.processed', amount, { currency });
  }
  
  // Performance monitoring
  trackApiLatency(endpoint: string, method: string, duration: number, statusCode: number) {
    this.trackMetric('api.latency', duration, { endpoint, method, status: statusCode.toString() });
  }
  
  trackDatabaseLatency(operation: string, duration: number) {
    this.trackMetric('database.latency', duration, { operation });
  }
  
  // Health checks
  async checkHealth(): Promise<{ healthy: boolean; services: Record<string, boolean> }> {
    const services: Record<string, boolean> = {
      sentry: this.initialized,
    };
    
    // Add more health checks as needed
    
    const healthy = Object.values(services).every(status => status);
    
    return { healthy, services };
  }
}

// Export singleton
export const monitoring = MonitoringService.getInstance();

// React Error Boundary integration
export function createErrorBoundary() {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }
    
    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }
    
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      monitoring.captureException(error, {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      });
    }
    
    render() {
      if (this.state.hasError) {
        return React.createElement('div', { className: 'error-boundary' },
          React.createElement('h2', null, 'Something went wrong'),
          React.createElement('p', null, 'We\'ve been notified and are working on a fix.'),
          React.createElement('button', { onClick: () => window.location.reload() }, 'Reload Page')
        );
      }
      
      return this.props.children;
    }
  };
}