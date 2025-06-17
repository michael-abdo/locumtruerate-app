/**
 * Zapier Mock Server
 * Provides mock Zapier webhook endpoints for testing integrations
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import type { ZapierMockConfig, MockServerInstance, ZapierWebhook } from './types';

export class ZapierMockServer implements MockServerInstance {
  private app: express.Application;
  public server: any;
  public port: number;
  public url: string;

  // In-memory webhook storage
  private webhooks = new Map<string, ZapierWebhook>();
  private webhookHistory: ZapierWebhook[] = [];

  constructor(private config: ZapierMockConfig) {
    this.port = config.port;
    this.url = `http://${config.host || 'localhost'}:${this.port}`;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    if (this.config.cors) {
      this.app.use(cors(this.config.cors));
    }

    // Optional webhook signature validation
    if (this.config.webhookSecret && this.config.enableAuth) {
      this.app.use('/hooks', (req, res, next) => {
        const signature = req.headers['x-zapier-signature'] as string;
        if (!signature) {
          return res.status(401).json({
            error: 'Missing webhook signature'
          });
        }

        const body = JSON.stringify(req.body);
        const expectedSignature = crypto
          .createHmac('sha256', this.config.webhookSecret!)
          .update(body)
          .digest('hex');

        if (signature !== expectedSignature) {
          return res.status(401).json({
            error: 'Invalid webhook signature'
          });
        }

        next();
      });
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'zapier-mock',
        total_webhooks: this.webhookHistory.length 
      });
    });

    // Generic webhook endpoint (catches all webhook URLs)
    this.app.post('/hooks/*', (req, res) => {
      const webhookUrl = req.originalUrl;
      const webhook: ZapierWebhook = {
        id: `hook_${uuidv4()}`,
        url: webhookUrl,
        event: req.body.event || 'unknown',
        data: req.body,
        timestamp: Date.now(),
        status: 'sent',
        retryCount: 0,
      };

      this.webhooks.set(webhook.id, webhook);
      this.webhookHistory.push(webhook);

      console.log(`🪝 Zapier webhook received: ${webhookUrl} | Event: ${webhook.event}`);
      console.log(`📊 Data:`, JSON.stringify(req.body, null, 2));

      // Simulate random webhook processing delays
      const delay = Math.random() * 1000;
      setTimeout(() => {
        res.json({
          success: true,
          message: 'Webhook received and processed',
          webhook_id: webhook.id,
          timestamp: webhook.timestamp
        });
      }, delay);
    });

    // Job-related webhook endpoints for LocumTrueRate
    this.app.post('/hooks/job-posted', (req, res) => {
      this.processJobWebhook('job.posted', req.body, res);
    });

    this.app.post('/hooks/job-applied', (req, res) => {
      this.processJobWebhook('job.applied', req.body, res);
    });

    this.app.post('/hooks/application-status-changed', (req, res) => {
      this.processJobWebhook('application.status_changed', req.body, res);
    });

    this.app.post('/hooks/user-registered', (req, res) => {
      this.processJobWebhook('user.registered', req.body, res);
    });

    this.app.post('/hooks/subscription-created', (req, res) => {
      this.processJobWebhook('subscription.created', req.body, res);
    });

    this.app.post('/hooks/payment-succeeded', (req, res) => {
      this.processJobWebhook('payment.succeeded', req.body, res);
    });

    // Webhook management endpoints for testing
    this.app.get('/webhooks', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const webhooks = this.webhookHistory.slice(offset, offset + limit);
      
      res.json({
        webhooks,
        total: this.webhookHistory.length,
        limit,
        offset
      });
    });

    this.app.get('/webhooks/:id', (req, res) => {
      const webhook = this.webhooks.get(req.params.id);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      res.json(webhook);
    });

    this.app.delete('/webhooks', (req, res) => {
      this.webhooks.clear();
      this.webhookHistory.length = 0;
      res.json({ message: 'All webhooks deleted' });
    });

    this.app.delete('/webhooks/:id', (req, res) => {
      const webhook = this.webhooks.get(req.params.id);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }
      
      this.webhooks.delete(req.params.id);
      const index = this.webhookHistory.findIndex(w => w.id === req.params.id);
      if (index !== -1) {
        this.webhookHistory.splice(index, 1);
      }
      
      res.json({ message: 'Webhook deleted' });
    });

    // Search webhooks
    this.app.get('/search', (req, res) => {
      const { event, url, status } = req.query;
      let results = [...this.webhookHistory];

      if (event) {
        results = results.filter(webhook => 
          webhook.event.toLowerCase().includes(event.toString().toLowerCase())
        );
      }

      if (url) {
        results = results.filter(webhook => 
          webhook.url.toLowerCase().includes(url.toString().toLowerCase())
        );
      }

      if (status) {
        results = results.filter(webhook => webhook.status === status);
      }

      res.json({
        results,
        total: results.length,
        query: { event, url, status }
      });
    });

    // Webhook retry simulation
    this.app.post('/webhooks/:id/retry', (req, res) => {
      const webhook = this.webhooks.get(req.params.id);
      if (!webhook) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      webhook.retryCount += 1;
      webhook.status = 'sent';
      webhook.timestamp = Date.now();
      this.webhooks.set(webhook.id, webhook);

      console.log(`🔄 Webhook retry: ${webhook.url} | Retry count: ${webhook.retryCount}`);

      res.json({
        success: true,
        message: 'Webhook retried',
        webhook
      });
    });

    // Statistics endpoint
    this.app.get('/stats', (req, res) => {
      const stats = {
        total_webhooks: this.webhookHistory.length,
        events: this.getEventStats(),
        status_counts: this.getStatusStats(),
        recent_activity: this.webhookHistory
          .slice(-10)
          .map(w => ({
            id: w.id,
            event: w.event,
            timestamp: w.timestamp,
            status: w.status
          }))
      };

      res.json(stats);
    });

    // Error handler
    this.app.use((err: any, req: any, res: any, next: any) => {
      console.error('Zapier mock error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    });
  }

  private processJobWebhook(event: string, data: any, res: express.Response): void {
    const webhook: ZapierWebhook = {
      id: `hook_${uuidv4()}`,
      url: `/hooks/${event.replace('.', '-')}`,
      event,
      data,
      timestamp: Date.now(),
      status: 'sent',
      retryCount: 0,
    };

    this.webhooks.set(webhook.id, webhook);
    this.webhookHistory.push(webhook);

    console.log(`🪝 LocumTrueRate webhook: ${event}`);
    console.log(`📊 Data:`, JSON.stringify(data, null, 2));

    res.json({
      success: true,
      message: `${event} webhook processed`,
      webhook_id: webhook.id,
      event,
      timestamp: webhook.timestamp
    });
  }

  private getEventStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.webhookHistory.forEach(webhook => {
      stats[webhook.event] = (stats[webhook.event] || 0) + 1;
    });
    return stats;
  }

  private getStatusStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.webhookHistory.forEach(webhook => {
      stats[webhook.status] = (stats[webhook.status] || 0) + 1;
    });
    return stats;
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.config.host || 'localhost', () => {
        console.log(`🪝 Zapier Mock Server running at ${this.url}`);
        console.log(`🪝 Webhook endpoint: ${this.url}/hooks/*`);
        console.log(`📊 Stats available at: ${this.url}/stats`);
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
          console.log('🪝 Zapier Mock Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Helper methods for testing
  getWebhook(id: string): ZapierWebhook | undefined {
    return this.webhooks.get(id);
  }

  getAllWebhooks(): ZapierWebhook[] {
    return [...this.webhookHistory];
  }

  getWebhooksByEvent(event: string): ZapierWebhook[] {
    return this.webhookHistory.filter(webhook => webhook.event === event);
  }

  clearWebhooks(): void {
    this.webhooks.clear();
    this.webhookHistory.length = 0;
  }

  getWebhookCount(): number {
    return this.webhookHistory.length;
  }

  getEventCount(event: string): number {
    return this.webhookHistory.filter(webhook => webhook.event === event).length;
  }
}