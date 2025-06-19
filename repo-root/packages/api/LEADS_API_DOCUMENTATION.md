# Leads API Documentation

## Overview

The Leads API provides comprehensive lead management functionality with Zapier webhook integration, automatic lead scoring, spam protection, and rate limiting. This API is designed to capture, score, and manage leads from various sources including the calculator tool, contact forms, and external integrations.

## Features

- ✅ **Lead CRUD Operations** - Complete create, read, update, delete functionality
- ✅ **Zapier Webhook Integration** - Automatic notifications to configured webhook URLs
- ✅ **Intelligent Lead Scoring** - Automatic scoring based on multiple criteria
- ✅ **Spam Protection** - Built-in spam detection and filtering
- ✅ **Rate Limiting** - Protection against abuse (10 submissions per 15 minutes per IP)
- ✅ **Calculator Integration** - Special handling for calculator-generated leads
- ✅ **Admin Dashboard Support** - Comprehensive statistics and filtering
- ✅ **Security & Validation** - Input validation and authentication
- ✅ **Bulk Operations** - Bulk update capabilities for efficiency

## Environment Variables

Add these to your `.env` file:

```bash
# Zapier Webhook Integration
ZAPIER_WEBHOOK_URLS=https://hooks.zapier.com/hooks/catch/12345/abcdef,https://hooks.zapier.com/hooks/catch/12345/ghijkl
ZAPIER_WEBHOOK_SECRET=your_zapier_webhook_secret_for_signature_validation
```

- `ZAPIER_WEBHOOK_URLS`: Comma-separated list of Zapier webhook URLs
- `ZAPIER_WEBHOOK_SECRET`: Secret for webhook signature validation (optional but recommended)

## API Endpoints

### Public Endpoints

#### Create Lead
```typescript
POST /api/trpc/leads.create

// Input
{
  email: string; // Required, valid email
  name?: string; // Optional, min 2 characters
  company?: string; // Optional
  phone?: string; // Optional
  message?: string; // Optional
  source?: string; // Default: "website"
  sourceId?: string; // Optional external ID
  metadata?: Record<string, any>; // Optional additional data
  calculationData?: Record<string, any>; // Optional calculator data
}

// Response
{
  success: boolean;
  message: string;
  leadId: string;
  score: number; // 0-100
}
```

### Admin Endpoints (Require Admin Authentication)

#### Get Leads
```typescript
GET /api/trpc/leads.getLeads

// Input (all optional)
{
  source?: string;
  status?: "new" | "contacted" | "qualified" | "converted" | "lost";
  minScore?: number; // 0-100
  maxScore?: number; // 0-100
  email?: string;
  company?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string; // Searches name, email, company, message
  page?: number; // Default: 1
  limit?: number; // Default: 20, max: 100
  sortBy?: "createdAt" | "updatedAt" | "score" | "status" | "email"; // Default: "createdAt"
  sortOrder?: "asc" | "desc"; // Default: "desc"
}

// Response
{
  leads: Lead[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### Get Lead by ID
```typescript
GET /api/trpc/leads.getById

// Input
{
  id: string;
}

// Response
Lead // Full lead object
```

#### Update Lead
```typescript
PUT /api/trpc/leads.updateLead

// Input
{
  id: string;
  status?: "new" | "contacted" | "qualified" | "converted" | "lost";
  score?: number; // 0-100
  notes?: string;
  metadata?: Record<string, any>;
}

// Response
Lead // Updated lead object
```

#### Delete Lead
```typescript
DELETE /api/trpc/leads.deleteLead

// Input
{
  id: string;
}

// Response
{
  success: boolean;
}
```

#### Get Leads by Source
```typescript
GET /api/trpc/leads.getLeadsBySource

// Input
{
  source: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Response
{
  leads: Lead[];
  pagination: PaginationInfo;
}
```

#### Get Lead Statistics
```typescript
GET /api/trpc/leads.getLeadStats

// Input (all optional)
{
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
}

// Response
{
  totals: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  averageScore: number;
  sourceBreakdown: Array<{
    source: string;
    count: number;
  }>;
  conversionRates: Array<{
    source: string;
    total: number;
    converted: number;
    rate: number; // Percentage
  }>;
  overallConversionRate: number; // Percentage
}
```

#### Rescore Lead
```typescript
POST /api/trpc/leads.rescoreLead

// Input
{
  id: string;
}

// Response
Lead // Lead with updated score
```

#### Bulk Update Leads
```typescript
PUT /api/trpc/leads.bulkUpdate

// Input
{
  ids: string[];
  updates: {
    status?: "new" | "contacted" | "qualified" | "converted" | "lost";
    score?: number; // 0-100
  };
}

// Response
{
  updatedCount: number;
}
```

#### Test Webhook
```typescript
POST /api/trpc/leads.testWebhook

// Input
{
  url: string; // Valid webhook URL
  event?: string; // Default: "test"
  secret?: string; // Optional webhook secret
}

// Response
{
  success: boolean;
  error?: string;
}
```

## Lead Scoring Algorithm

Leads are automatically scored on a 0-100 scale based on multiple criteria:

### Source Scoring (0-25 points)
- **Calculator**: 25 points
- **Referral**: 25 points
- **Demo Request**: 22 points
- **Contact Form**: 20 points
- **Zapier**: 20 points
- **Paid Ad**: 18 points
- **Newsletter**: 15 points
- **API**: 15 points
- **Organic**: 15 points
- **Blog**: 12 points
- **Website**: 10 points
- **Social**: 10 points

### Profile Completeness (0-20 points)
- **Name provided**: +5 points
- **Company provided**: +8 points
- **Phone provided**: +7 points

### Message Quality (0-25 points)
- **200+ characters**: 25 points
- **100-199 characters**: 20 points
- **50-99 characters**: 15 points
- **10-49 characters**: 10 points

### Calculator Data Bonus (0-25 points)
- **Has calculation data**: +20 points
- **High-value calculation** (>$150k salary): +5 additional points

### Engagement Indicators (0-10 points)
- **UTM source present**: +3 points
- **Referrer present**: +2 points
- **Long session** (>5 minutes): +5 points

## Zapier Webhook Integration

### Webhook Events

The system sends webhooks for the following events:

1. **`lead.created`** - When a new lead is created
2. **`lead.updated`** - When a lead status/score is updated
3. **`lead.converted`** - When a lead is marked as converted

### Webhook Payload Structure

```json
{
  "event": "lead.created",
  "data": {
    "id": "lead_123",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "phone": "555-0123",
    "message": "Interested in your services",
    "source": "calculator",
    "score": 85,
    "status": "new",
    "createdAt": "2024-01-15T10:30:00Z",
    "metadata": {
      "calculationData": {...},
      "scoreBreakdown": {...}
    }
  },
  "timestamp": 1705312200000,
  "version": "1.0"
}
```

### Webhook Security

- **Signature Validation**: If `ZAPIER_WEBHOOK_SECRET` is configured, webhooks include an `X-Webhook-Signature` header with HMAC-SHA256 signature
- **Retry Logic**: Failed webhooks are automatically retried up to 3 times with exponential backoff
- **Timeout Handling**: Webhook requests timeout after 30 seconds

### Webhook Configuration

1. Set up your Zapier webhook URLs in environment variables
2. Configure the webhook secret for security
3. Use the test webhook endpoint to verify connectivity

```bash
# Test webhook
curl -X POST '/api/trpc/leads.testWebhook' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer admin_token' \
  -d '{
    "url": "https://hooks.zapier.com/hooks/catch/12345/abcdef",
    "event": "test",
    "secret": "your_webhook_secret"
  }'
```

## Spam Protection

The system includes built-in spam detection:

### Spam Detection Criteria
- **Spam keywords**: viagra, casino, lottery, investment, crypto, bitcoin, loan, debt
- **Suspicious patterns**: Too many numbers, consecutive capitals, repeated characters
- **Email patterns**: Numbers at start, suspicious domains, temporary email TLDs

### Spam Handling
- Spam leads are silently rejected (returns success to avoid revealing detection)
- Spam attempts are logged for monitoring
- No webhook notifications sent for spam leads

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- **Limit**: 10 lead submissions per 15 minutes per IP address
- **Scope**: Applies only to lead creation endpoint
- **Response**: `429 Too Many Requests` when limit exceeded
- **Headers**: Rate limit information included in response headers

## Calculator Integration

Special handling for leads generated from the calculator tool:

### Calculator Lead Benefits
- **Higher scoring**: Calculator leads receive 25 points for source + 20 points for calculation data
- **Rich metadata**: Calculation results are stored in lead metadata
- **Enhanced targeting**: Salary information enables better lead qualification

### Calculator Lead Data Structure
```json
{
  "source": "calculator",
  "calculationData": {
    "type": "contract", // or "paycheck", "comparison"
    "annualSalary": 180000,
    "hourlyRate": 87.50,
    "location": "San Francisco, CA",
    "specialty": "Emergency Medicine",
    "results": {
      // Calculation results
    }
  }
}
```

## Error Handling

The API provides comprehensive error handling:

### Error Response Format
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "data": {
      "zodError": [
        {
          "path": ["email"],
          "message": "Invalid email address"
        }
      ]
    }
  }
}
```

### Common Error Codes
- `BAD_REQUEST` - Invalid input data
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Lead not found
- `TOO_MANY_REQUESTS` - Rate limit exceeded
- `INTERNAL_SERVER_ERROR` - Server error

## Usage Examples

### Create a Basic Lead
```javascript
const response = await fetch('/api/trpc/leads.create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'doctor@hospital.com',
    name: 'Dr. Sarah Johnson',
    company: 'City General Hospital',
    phone: '555-0123',
    message: 'Interested in locum opportunities in cardiology',
    source: 'contact_form'
  })
});

const result = await response.json();
console.log('Lead created:', result.leadId, 'Score:', result.score);
```

### Create a Calculator Lead
```javascript
const response = await fetch('/api/trpc/leads.create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'doctor@example.com',
    name: 'Dr. Michael Chen',
    source: 'calculator',
    calculationData: {
      type: 'contract',
      annualSalary: 250000,
      hourlyRate: 120,
      location: 'Los Angeles, CA',
      specialty: 'Anesthesiology',
      results: {
        weeklyGross: 4800,
        monthlyGross: 20800,
        yearlyGross: 249600
      }
    },
    metadata: {
      utm_source: 'google',
      utm_campaign: 'salary_calculator',
      sessionDuration: 420
    }
  })
});
```

### Query Leads (Admin)
```javascript
const response = await fetch('/api/trpc/leads.getLeads', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer admin_token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    source: 'calculator',
    status: 'new',
    minScore: 80,
    page: 1,
    limit: 50,
    sortBy: 'score',
    sortOrder: 'desc'
  })
});

const result = await response.json();
console.log('High-scoring calculator leads:', result.leads.length);
```

### Update Lead Status
```javascript
const response = await fetch('/api/trpc/leads.updateLead', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer admin_token',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'lead_123',
    status: 'qualified',
    notes: 'Highly qualified candidate with excellent credentials'
  })
});
```

## Performance Considerations

- **Database Indexing**: Leads table is indexed on email, status, score, and createdAt
- **Pagination**: Always use pagination for lead queries to avoid large response payloads
- **Webhook Async**: Webhook notifications are sent asynchronously to avoid blocking lead creation
- **Rate Limiting**: Implement client-side rate limiting to avoid hitting API limits
- **Bulk Operations**: Use bulk update for multiple lead modifications

## Monitoring and Logging

The API provides comprehensive logging:

- **Lead Creation**: Email, source, score, IP address
- **Status Changes**: Lead ID, old/new status, admin user
- **Webhook Failures**: URL, error message, retry attempts
- **Spam Detection**: Email, reason, IP address
- **Rate Limiting**: IP address, request count

Monitor these logs for:
- Lead quality trends
- Webhook reliability
- Spam attack patterns
- API usage patterns

## Security Best Practices

1. **Environment Variables**: Never commit webhook URLs or secrets to version control
2. **Admin Authentication**: Ensure proper authentication for admin endpoints
3. **Input Validation**: All inputs are validated using Zod schemas
4. **Rate Limiting**: Implement additional rate limiting at infrastructure level
5. **Webhook Security**: Always use webhook secrets for signature validation
6. **IP Allowlisting**: Consider allowlisting trusted IP addresses for webhook endpoints
7. **Audit Logging**: All admin actions are logged for audit purposes

## Troubleshooting

### Common Issues

1. **Webhook Not Received**
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Test webhook endpoint manually

2. **Rate Limiting Triggered**
   - Implement client-side delays
   - Use different IP addresses for testing
   - Contact support for limit increases

3. **Lead Not Created**
   - Check for spam detection triggers
   - Verify input validation
   - Review server logs for errors

4. **Low Lead Scores**
   - Ensure complete profile data
   - Include meaningful messages
   - Use high-value sources (calculator, referrals)

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your environment variables to see detailed request/response information.