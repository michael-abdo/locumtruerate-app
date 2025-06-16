/**
 * Stripe Mock Server
 * Provides mock Stripe API endpoints for testing payments and subscriptions
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { 
  StripeMockConfig, 
  MockServerInstance, 
  StripeCustomer, 
  StripePaymentIntent, 
  StripeSubscription 
} from './types';

export class StripeMockServer implements MockServerInstance {
  private app: express.Application;
  public server: any;
  public port: number;
  public url: string;

  // In-memory storage
  private customers = new Map<string, StripeCustomer>();
  private paymentIntents = new Map<string, StripePaymentIntent>();
  private subscriptions = new Map<string, StripeSubscription>();

  constructor(private config: StripeMockConfig) {
    this.port = config.port;
    this.url = `http://${config.host || 'localhost'}:${this.port}`;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    if (this.config.cors) {
      this.app.use(cors(this.config.cors));
    }

    // Mock Stripe API key validation
    this.app.use((req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer sk_test_')) {
        return res.status(401).json({
          error: {
            type: 'authentication_error',
            message: 'Invalid API key provided'
          }
        });
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'stripe-mock' });
    });

    // Customers
    this.app.post('/v1/customers', (req, res) => {
      const customer: StripeCustomer = {
        id: `cus_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
        email: req.body.email,
        name: req.body.name,
        metadata: req.body.metadata || {},
        created: Math.floor(Date.now() / 1000),
      };
      
      this.customers.set(customer.id, customer);
      res.json(customer);
    });

    this.app.get('/v1/customers/:id', (req, res) => {
      const customer = this.customers.get(req.params.id);
      if (!customer) {
        return res.status(404).json({
          error: {
            type: 'invalid_request_error',
            message: 'No such customer'
          }
        });
      }
      res.json(customer);
    });

    // Payment Intents
    this.app.post('/v1/payment_intents', (req, res) => {
      const paymentIntent: StripePaymentIntent = {
        id: `pi_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
        amount: req.body.amount,
        currency: req.body.currency || this.config.defaultCurrency || 'usd',
        status: 'requires_payment_method',
        client_secret: `pi_${uuidv4().replace(/-/g, '').substring(0, 24)}_secret_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        customer: req.body.customer,
        metadata: req.body.metadata || {},
        created: Math.floor(Date.now() / 1000),
      };

      this.paymentIntents.set(paymentIntent.id, paymentIntent);
      res.json(paymentIntent);
    });

    this.app.post('/v1/payment_intents/:id/confirm', (req, res) => {
      const paymentIntent = this.paymentIntents.get(req.params.id);
      if (!paymentIntent) {
        return res.status(404).json({
          error: {
            type: 'invalid_request_error',
            message: 'No such payment_intent'
          }
        });
      }

      // Simulate payment processing
      paymentIntent.status = Math.random() > 0.1 ? 'succeeded' : 'requires_action';
      this.paymentIntents.set(paymentIntent.id, paymentIntent);
      
      res.json(paymentIntent);
    });

    this.app.get('/v1/payment_intents/:id', (req, res) => {
      const paymentIntent = this.paymentIntents.get(req.params.id);
      if (!paymentIntent) {
        return res.status(404).json({
          error: {
            type: 'invalid_request_error',
            message: 'No such payment_intent'
          }
        });
      }
      res.json(paymentIntent);
    });

    // Subscriptions
    this.app.post('/v1/subscriptions', (req, res) => {
      const subscription: StripeSubscription = {
        id: `sub_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
        customer: req.body.customer,
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        items: {
          data: req.body.items?.map((item: any) => ({
            id: `si_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
            price: {
              id: item.price,
              unit_amount: item.price_data?.unit_amount || 2999,
              currency: item.price_data?.currency || 'usd',
              recurring: {
                interval: item.price_data?.recurring?.interval || 'month'
              }
            }
          })) || []
        },
        metadata: req.body.metadata || {},
        created: Math.floor(Date.now() / 1000),
      };

      this.subscriptions.set(subscription.id, subscription);
      res.json(subscription);
    });

    this.app.get('/v1/subscriptions/:id', (req, res) => {
      const subscription = this.subscriptions.get(req.params.id);
      if (!subscription) {
        return res.status(404).json({
          error: {
            type: 'invalid_request_error',
            message: 'No such subscription'
          }
        });
      }
      res.json(subscription);
    });

    this.app.delete('/v1/subscriptions/:id', (req, res) => {
      const subscription = this.subscriptions.get(req.params.id);
      if (!subscription) {
        return res.status(404).json({
          error: {
            type: 'invalid_request_error',
            message: 'No such subscription'
          }
        });
      }

      subscription.status = 'canceled';
      this.subscriptions.set(subscription.id, subscription);
      res.json(subscription);
    });

    // Webhook endpoint simulation
    if (this.config.webhookEndpoint) {
      this.app.post(this.config.webhookEndpoint, (req, res) => {
        console.log('Mock Stripe webhook received:', req.body);
        res.json({ received: true });
      });
    }

    // Error handler
    this.app.use((err: any, req: any, res: any, next: any) => {
      console.error('Stripe mock error:', err);
      res.status(500).json({
        error: {
          type: 'api_error',
          message: 'An error occurred'
        }
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.config.host || 'localhost', () => {
        console.log(`🎭 Stripe Mock Server running at ${this.url}`);
        resolve();
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`Port ${this.port} is busy, trying ${this.port + 1}`);
          this.port += 1;
          this.url = `http://${this.config.host || 'localhost'}:${this.port}`;
          this.server.listen(this.port, this.config.host || 'localhost');
        } else {
          reject(err);
        }
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('🎭 Stripe Mock Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Helper methods for testing
  getCustomer(id: string): StripeCustomer | undefined {
    return this.customers.get(id);
  }

  getPaymentIntent(id: string): StripePaymentIntent | undefined {
    return this.paymentIntents.get(id);
  }

  getSubscription(id: string): StripeSubscription | undefined {
    return this.subscriptions.get(id);
  }

  clearData(): void {
    this.customers.clear();
    this.paymentIntents.clear();
    this.subscriptions.clear();
  }
}