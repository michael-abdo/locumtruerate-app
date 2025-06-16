/**
 * Email Mock Server
 * Provides mock email API endpoints for testing email functionality
 * Compatible with SendGrid and generic SMTP services
 */

import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { EmailMockConfig, MockServerInstance, EmailMessage } from './types';

export class EmailMockServer implements MockServerInstance {
  private app: express.Application;
  public server: any;
  public port: number;
  public url: string;

  // In-memory email storage
  private emails = new Map<string, EmailMessage>();
  private inbox: EmailMessage[] = [];

  constructor(private config: EmailMockConfig) {
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

    // Mock API key validation (SendGrid style)
    this.app.use('/v3', (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth || !auth.startsWith('Bearer SG.')) {
        return res.status(401).json({
          errors: [{
            message: 'The provided authorization grant is invalid, expired, or revoked',
            field: 'authorization',
            help: 'Valid API key required'
          }]
        });
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'okay', 
        service: 'email-mock',
        total_emails: this.inbox.length 
      });
    });

    // SendGrid-compatible API
    this.app.post('/v3/mail/send', (req, res) => {
      try {
        const { personalizations, from, subject, content, attachments } = req.body;
        
        if (!personalizations || !personalizations[0] || !personalizations[0].to) {
          return res.status(400).json({
            errors: [{
              message: 'Missing required parameter: personalizations[0].to',
              field: 'personalizations.to'
            }]
          });
        }

        const email: EmailMessage = {
          id: `msg_${uuidv4()}`,
          from: `${from.name || ''} <${from.email}>`.trim(),
          to: personalizations[0].to.map((t: any) => `${t.name || ''} <${t.email}>`.trim()),
          cc: personalizations[0].cc?.map((c: any) => `${c.name || ''} <${c.email}>`.trim()) || [],
          bcc: personalizations[0].bcc?.map((b: any) => `${b.name || ''} <${b.email}>`.trim()) || [],
          subject: personalizations[0].subject || subject,
          text: content?.find((c: any) => c.type === 'text/plain')?.value,
          html: content?.find((c: any) => c.type === 'text/html')?.value,
          attachments: attachments?.map((a: any) => ({
            filename: a.filename,
            content: a.content,
            contentType: a.type
          })) || [],
          timestamp: Date.now(),
        };

        this.emails.set(email.id, email);
        this.inbox.push(email);

        console.log(`📧 Mock email sent: ${email.from} → ${email.to.join(', ')} | Subject: ${email.subject}`);

        res.status(202).json({
          message: 'Email queued for delivery',
          message_id: email.id
        });
      } catch (error) {
        console.error('Email mock error:', error);
        res.status(400).json({
          errors: [{
            message: 'Invalid request body',
            field: 'request_body'
          }]
        });
      }
    });

    // Generic email API (for other email services)
    this.app.post('/send', (req, res) => {
      try {
        const { to, from, subject, text, html, cc, bcc, attachments } = req.body;

        if (!to || !from || !subject) {
          return res.status(400).json({
            error: 'Missing required fields: to, from, subject'
          });
        }

        const email: EmailMessage = {
          id: `msg_${uuidv4()}`,
          from: typeof from === 'string' ? from : `${from.name || ''} <${from.email}>`.trim(),
          to: Array.isArray(to) ? to : [to],
          cc: cc || [],
          bcc: bcc || [],
          subject,
          text,
          html,
          attachments: attachments || [],
          timestamp: Date.now(),
        };

        this.emails.set(email.id, email);
        this.inbox.push(email);

        console.log(`📧 Mock email sent: ${email.from} → ${email.to.join(', ')} | Subject: ${email.subject}`);

        res.json({
          success: true,
          message_id: email.id,
          message: 'Email sent successfully'
        });
      } catch (error) {
        console.error('Email mock error:', error);
        res.status(500).json({
          error: 'Failed to send email',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // Email management endpoints for testing
    this.app.get('/emails', (req, res) => {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const emails = this.inbox.slice(offset, offset + limit);
      
      res.json({
        emails,
        total: this.inbox.length,
        limit,
        offset
      });
    });

    this.app.get('/emails/:id', (req, res) => {
      const email = this.emails.get(req.params.id);
      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }
      res.json(email);
    });

    this.app.delete('/emails', (req, res) => {
      this.emails.clear();
      this.inbox.length = 0;
      res.json({ message: 'All emails deleted' });
    });

    this.app.delete('/emails/:id', (req, res) => {
      const email = this.emails.get(req.params.id);
      if (!email) {
        return res.status(404).json({ error: 'Email not found' });
      }
      
      this.emails.delete(req.params.id);
      const index = this.inbox.findIndex(e => e.id === req.params.id);
      if (index !== -1) {
        this.inbox.splice(index, 1);
      }
      
      res.json({ message: 'Email deleted' });
    });

    // Search emails
    this.app.get('/search', (req, res) => {
      const { q, from, to, subject } = req.query;
      let results = [...this.inbox];

      if (q) {
        const query = q.toString().toLowerCase();
        results = results.filter(email => 
          email.subject.toLowerCase().includes(query) ||
          email.text?.toLowerCase().includes(query) ||
          email.html?.toLowerCase().includes(query)
        );
      }

      if (from) {
        results = results.filter(email => 
          email.from.toLowerCase().includes(from.toString().toLowerCase())
        );
      }

      if (to) {
        results = results.filter(email => 
          email.to.some(recipient => 
            recipient.toLowerCase().includes(to.toString().toLowerCase())
          )
        );
      }

      if (subject) {
        results = results.filter(email => 
          email.subject.toLowerCase().includes(subject.toString().toLowerCase())
        );
      }

      res.json({
        results,
        total: results.length,
        query: { q, from, to, subject }
      });
    });

    // Webhook simulation endpoint
    this.app.post('/webhook', (req, res) => {
      console.log('📧 Email webhook received:', req.body);
      res.json({ received: true });
    });

    // Error handler
    this.app.use((err: any, req: any, res: any, next: any) => {
      console.error('Email mock error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    });
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, this.config.host || 'localhost', () => {
        console.log(`📧 Email Mock Server running at ${this.url}`);
        console.log(`📧 View emails at: ${this.url}/emails`);
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
          console.log('📧 Email Mock Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  // Helper methods for testing
  getEmail(id: string): EmailMessage | undefined {
    return this.emails.get(id);
  }

  getAllEmails(): EmailMessage[] {
    return [...this.inbox];
  }

  getEmailsTo(email: string): EmailMessage[] {
    return this.inbox.filter(msg => 
      msg.to.some(recipient => recipient.includes(email))
    );
  }

  getEmailsFrom(email: string): EmailMessage[] {
    return this.inbox.filter(msg => msg.from.includes(email));
  }

  clearEmails(): void {
    this.emails.clear();
    this.inbox.length = 0;
  }

  getEmailCount(): number {
    return this.inbox.length;
  }
}