/**
 * Analytics and business metrics tracking
 * Integrates with Cloudflare Analytics and custom metrics
 */

export interface AnalyticsEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
  value?: number;
  timestamp?: string;
}

export interface PageViewEvent {
  path: string;
  title: string;
  referrer?: string;
  searchParams?: Record<string, string>;
}

export interface UserProperties {
  userId?: string;
  organizationId?: string;
  role?: string;
  subscriptionTier?: string;
  companySize?: string;
  industry?: string;
}

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: string;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private initialized = false;
  private userProperties: UserProperties = {};
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval?: NodeJS.Timeout;
  
  private constructor() {
    this.sessionId = this.generateSessionId();
  }
  
  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }
  
  initialize(cloudflareToken?: string) {
    if (this.initialized) return;
    
    // Initialize Cloudflare Analytics
    if (cloudflareToken && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      script.defer = true;
      script.setAttribute('data-cf-beacon', `{"token": "${cloudflareToken}"}`);
      document.head.appendChild(script);
    }
    
    // Start event queue flush interval
    this.flushInterval = setInterval(() => this.flushEvents(), 10000); // 10 seconds
    
    this.initialized = true;
  }
  
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  // User identification
  identify(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties };
    
    // Send to analytics services
    this.track('User Identified', {
      category: 'user',
      properties: this.userProperties,
    });
  }
  
  reset() {
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
    this.eventQueue = [];
  }
  
  // Page tracking
  pageView(event: PageViewEvent) {
    this.track('Page View', {
      category: 'navigation',
      properties: {
        ...event,
        sessionId: this.sessionId,
      },
    });
  }
  
  // Event tracking
  track(eventName: string, options: Omit<AnalyticsEvent, 'name'> = { category: 'general' }) {
    const event: AnalyticsEvent = {
      name: eventName,
      category: options.category,
      properties: {
        ...options.properties,
        ...this.userProperties,
        sessionId: this.sessionId,
      },
      value: options.value,
      timestamp: new Date().toISOString(),
    };
    
    // Add to queue
    this.eventQueue.push(event);
    
    // Flush if queue is getting large
    if (this.eventQueue.length >= 50) {
      this.flushEvents();
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }
  
  // Business event tracking
  trackJobPosted(job: {
    id: string;
    title: string;
    company: string;
    type?: string;
    category?: string;
    salary?: string;
  }) {
    this.track('Job Posted', {
      category: 'business',
      properties: job,
    });
    
    this.incrementMetric('jobs.posted', { 
      company: job.company,
      type: job.type || 'unknown',
      category: job.category || 'other',
    });
  }
  
  trackApplicationSubmitted(application: {
    id: string;
    jobId: string;
    jobTitle?: string;
    company?: string;
  }) {
    this.track('Application Submitted', {
      category: 'business',
      properties: application,
    });
    
    this.incrementMetric('applications.submitted', {
      jobId: application.jobId,
      company: application.company || 'unknown',
    });
  }
  
  trackJobViewed(job: {
    id: string;
    title: string;
    company: string;
    viewDuration?: number;
  }) {
    this.track('Job Viewed', {
      category: 'engagement',
      properties: job,
      value: job.viewDuration,
    });
    
    this.incrementMetric('jobs.views', {
      jobId: job.id,
      company: job.company,
    });
  }
  
  trackSearchPerformed(search: {
    query: string;
    filters?: Record<string, any>;
    resultsCount: number;
    clickedResult?: boolean;
  }) {
    this.track('Search Performed', {
      category: 'engagement',
      properties: search,
      value: search.resultsCount,
    });
    
    if (search.clickedResult) {
      this.incrementMetric('search.click_through_rate');
    }
  }
  
  trackSubscriptionEvent(event: {
    type: 'started' | 'upgraded' | 'downgraded' | 'cancelled';
    tier: string;
    previousTier?: string;
    mrr?: number;
  }) {
    this.track(`Subscription ${event.type}`, {
      category: 'revenue',
      properties: event,
      value: event.mrr,
    });
    
    this.recordMetric('subscription.mrr', event.mrr || 0, {
      tier: event.tier,
      type: event.type,
    });
  }
  
  trackPaymentEvent(payment: {
    amount: number;
    currency: string;
    type: 'subscription' | 'one-time';
    status: 'succeeded' | 'failed';
  }) {
    this.track('Payment Processed', {
      category: 'revenue',
      properties: payment,
      value: payment.status === 'succeeded' ? payment.amount : 0,
    });
    
    if (payment.status === 'succeeded') {
      this.recordMetric('revenue.total', payment.amount, {
        currency: payment.currency,
        type: payment.type,
      });
    }
  }
  
  // Performance tracking
  trackPerformance(metric: {
    name: string;
    value: number;
    unit?: string;
    tags?: Record<string, string>;
  }) {
    this.track('Performance Metric', {
      category: 'performance',
      properties: metric,
      value: metric.value,
    });
    
    this.recordMetric(`performance.${metric.name}`, metric.value, metric.tags);
  }
  
  // Custom metrics
  private incrementMetric(name: string, tags?: Record<string, string>) {
    this.recordMetric(name, 1, tags, 'increment');
  }
  
  private recordMetric(
    name: string, 
    value: number, 
    tags?: Record<string, string>,
    type: 'gauge' | 'increment' = 'gauge'
  ) {
    const metric: MetricData = {
      name,
      value,
      tags: {
        ...tags,
        environment: process.env.NODE_ENV || 'development',
      },
      timestamp: new Date().toISOString(),
    };
    
    // In production, send to metrics service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Cloudflare Analytics or custom metrics endpoint
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, metric }),
      }).catch(console.error);
    }
  }
  
  // Conversion tracking
  trackConversion(conversion: {
    type: 'signup' | 'job_post' | 'subscription' | 'application';
    value?: number;
    source?: string;
    campaign?: string;
  }) {
    this.track(`Conversion: ${conversion.type}`, {
      category: 'conversion',
      properties: conversion,
      value: conversion.value,
    });
    
    // Track conversion rate
    this.incrementMetric(`conversions.${conversion.type}`, {
      source: conversion.source || 'direct',
      campaign: conversion.campaign || 'none',
    });
  }
  
  // A/B testing
  trackExperiment(experiment: {
    name: string;
    variant: string;
    success?: boolean;
  }) {
    this.track('Experiment Viewed', {
      category: 'experiment',
      properties: experiment,
    });
    
    if (experiment.success !== undefined) {
      this.incrementMetric(`experiments.${experiment.name}.${experiment.variant}`, {
        success: experiment.success.toString(),
      });
    }
  }
  
  // Flush events to analytics service
  private async flushEvents() {
    if (this.eventQueue.length === 0) return;
    
    const events = [...this.eventQueue];
    this.eventQueue = [];
    
    try {
      // In production, send to analytics endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        });
      }
    } catch (error) {
      // Re-add events to queue on failure
      this.eventQueue.unshift(...events);
      console.error('Failed to flush analytics events:', error);
    }
  }
  
  // Cleanup
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushEvents();
  }
}

// Export singleton
export const analytics = AnalyticsService.getInstance();

// Next.js analytics integration
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
}) {
  analytics.trackPerformance({
    name: metric.name,
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    unit: metric.name === 'CLS' ? 'score' : 'ms',
    tags: { label: metric.label },
  });
}