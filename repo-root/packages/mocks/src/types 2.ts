/**
 * Mock Services Type Definitions
 */

import type { Server } from 'http';

export interface MockServerConfig {
  port: number;
  host?: string;
  cors?: {
    origin: string | string[];
    credentials?: boolean;
  };
}

export interface MockServerInstance {
  server: Server;
  port: number;
  url: string;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface StripeMockConfig extends MockServerConfig {
  webhookEndpoint?: string;
  defaultCurrency?: string;
}

export interface ZapierMockConfig extends MockServerConfig {
  webhookSecret?: string;
  enableAuth?: boolean;
}

export interface EmailMockConfig extends MockServerConfig {
  smtpPort?: number;
  enableSMTP?: boolean;
}

// Stripe Mock Types
export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
  created: number;
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  customer?: string;
  metadata?: Record<string, string>;
  created: number;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
  current_period_start: number;
  current_period_end: number;
  items: {
    data: Array<{
      id: string;
      price: {
        id: string;
        unit_amount: number;
        currency: string;
        recurring: {
          interval: 'day' | 'week' | 'month' | 'year';
        };
      };
    }>;
  };
  metadata?: Record<string, string>;
  created: number;
}

// Email Mock Types
export interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  timestamp: number;
}

// Zapier Mock Types
export interface ZapierWebhook {
  id: string;
  url: string;
  event: string;
  data: Record<string, any>;
  timestamp: number;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
}