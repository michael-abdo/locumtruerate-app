# 🚀 Boost Payment Feature - Deployment Guide

**Feature**: Job Boost Payment System  
**Created**: June 18, 2025  
**Status**: ✅ Ready for Staging Deployment  
**Validation**: 100% (24/24 tests passed)

## 📋 Pre-Deployment Checklist

### 🔐 Environment Variables Required

```bash
# Stripe Configuration (CRITICAL)
STRIPE_SECRET_KEY=sk_live_your_production_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Database Configuration (CRITICAL)
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
DIRECT_DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Application URLs (for Stripe redirects)
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

### 🗄️ Database Migration

**⚠️ CRITICAL: Backup database before migration!**

```bash
# 1. Backup current database
pg_dump $DATABASE_URL > backup_before_boost_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration
cd packages/database
npx prisma db push

# 3. Verify migration
npx prisma studio  # Check that boost fields exist on Job table
```

**Alternative: Manual Migration**
```bash
# If Prisma migration fails, run manual SQL:
psql $DATABASE_URL -f packages/database/migrations/add_boost_fields.sql
```

### 🛠️ Stripe Configuration

1. **Create Stripe Products** (if not exists):
```bash
# Featured Boost - $49 for 7 days
stripe products create \
  --name "Featured Job Boost" \
  --description "Highlight your job listing with premium visibility"

# Premium Boost - $99 for 14 days  
stripe products create \
  --name "Premium Job Boost" \
  --description "Maximum exposure with guaranteed top placement"

# Urgent Boost - $29 for 3 days
stripe products create \
  --name "Urgent Hiring Boost" \
  --description "Fast-track your urgent hiring needs"

# Sponsored Boost - $79 for 10 days
stripe products create \
  --name "Sponsored Job Boost" \
  --description "Professional sponsored placement with analytics"
```

2. **Set up Webhook Endpoints**:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`

### 🔍 Staging Validation Steps

#### 1. **Basic Function Test**
```bash
# Test API endpoints are accessible
curl -X POST https://staging.your-domain.com/api/trpc/payments.createBoostCheckout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN" \
  -d '{
    "jobId": "test-job-id",
    "packageId": "featured", 
    "packageName": "Featured Boost",
    "packagePrice": 49,
    "packageDuration": 7,
    "successUrl": "https://staging.your-domain.com/admin/boost-management?success=true",
    "cancelUrl": "https://staging.your-domain.com/admin/boost-management?canceled=true"
  }'
```

#### 2. **End-to-End Payment Test**
1. Navigate to: `https://staging.your-domain.com/admin/boost-management`
2. Click "Boost" on any job listing
3. Select a boost package
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete payment flow
6. Verify job is marked as boosted in database
7. Check boost expiration date is correct

#### 3. **Error Scenario Tests**
- Test with declined card: `4000 0000 0000 0002`
- Test with insufficient funds: `4000 0000 0000 9995`
- Test payment timeout/abandonment
- Verify error messages display correctly

#### 4. **Database Validation**
```sql
-- Check boost fields were added correctly
\d "Job"

-- Verify constraints are in place
SELECT conname, contype FROM pg_constraint 
WHERE conrelid = '"Job"'::regclass 
AND conname LIKE '%boost%';

-- Test boost activation
UPDATE "Job" SET 
  "isBoosted" = true,
  "boostType" = 'featured',
  "boostExpiresAt" = NOW() + INTERVAL '7 days',
  "boostActivatedAt" = NOW()
WHERE id = 'test-job-id';

-- Verify constraints work
UPDATE "Job" SET "isBoosted" = true, "boostType" = NULL WHERE id = 'test-job-id';
-- Should fail with constraint violation
```

## 🚀 Production Deployment Steps

### Step 1: Code Deployment
```bash
# 1. Deploy application code
git checkout main
git pull origin main
npm run build
npm run deploy  # or your deployment command

# 2. Verify deployment
curl https://your-domain.com/api/health
```

### Step 2: Database Migration
```bash
# 1. Create database backup
pg_dump $DATABASE_URL > production_backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Run migration during maintenance window
npx prisma db push

# 3. Verify migration success
npx prisma studio
```

### Step 3: Environment Configuration
```bash
# Set production environment variables
# (Use your deployment platform's method - Vercel, Railway, etc.)

# Verify environment variables are loaded
curl https://your-domain.com/api/config/check
```

### Step 4: Stripe Webhook Configuration
1. Update webhook URL in Stripe dashboard
2. Test webhook delivery
3. Monitor webhook logs

### Step 5: Monitoring Setup
```bash
# Set up alerts for:
# - Payment failures (>5% failure rate)
# - Database connection issues
# - Boost activation failures
# - Stripe webhook failures
```

## 🔧 Troubleshooting Guide

### Common Issues

#### 1. **"User not found" Error**
```typescript
// Cause: User context missing email or ID
// Solution: Check authentication middleware

// Debug:
console.log('User context:', ctx.user)
```

#### 2. **"Database connection failed"**
```bash
# Check database URL format
echo $DATABASE_URL
echo $DIRECT_DATABASE_URL

# Test connection
npx prisma studio
```

#### 3. **"Stripe API error"** 
```bash
# Verify Stripe keys
stripe logs tail --live

# Check API key format
echo $STRIPE_SECRET_KEY | cut -c1-10
# Should output: sk_live_ or sk_test_
```

#### 4. **"Module not found: @/lib/trpc/client"**
```bash
# Check tRPC client exists
ls -la apps/web/src/lib/trpc/client.ts

# Verify tsconfig paths
cat apps/web/tsconfig.json | grep -A5 "paths"
```

### Rollback Procedure
```bash
# 1. Stop application
pm2 stop all  # or your process manager

# 2. Rollback database (if needed)
psql $DATABASE_URL -f packages/database/migrations/rollback_boost_fields.sql

# 3. Deploy previous version
git checkout PREVIOUS_COMMIT_HASH
npm run deploy

# 4. Verify rollback
curl https://your-domain.com/api/health
```

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **Boost conversion rate**: Percentage of users who complete boost payment
- **Payment success rate**: Percentage of successful Stripe transactions  
- **Boost effectiveness**: Job application increase after boost
- **Revenue per boost type**: Average revenue by package
- **Boost duration utilization**: How long boosts remain active

### Database Queries for Monitoring
```sql
-- Daily boost revenue
SELECT 
  DATE(b."boostActivatedAt") as date,
  b."boostType",
  COUNT(*) as boosts_count,
  CASE b."boostType"
    WHEN 'featured' THEN COUNT(*) * 49
    WHEN 'urgent' THEN COUNT(*) * 29  
    WHEN 'premium' THEN COUNT(*) * 99
    WHEN 'sponsored' THEN COUNT(*) * 79
  END as revenue
FROM "Job" b 
WHERE b."isBoosted" = true 
  AND b."boostActivatedAt" >= NOW() - INTERVAL '7 days'
GROUP BY DATE(b."boostActivatedAt"), b."boostType"
ORDER BY date DESC;

-- Active boosts
SELECT 
  COUNT(*) as active_boosts,
  COUNT(CASE WHEN "boostExpiresAt" < NOW() THEN 1 END) as expired_boosts
FROM "Job" 
WHERE "isBoosted" = true;

-- Boost package popularity
SELECT 
  "boostType",
  COUNT(*) as usage_count,
  ROUND(AVG(EXTRACT(EPOCH FROM ("boostExpiresAt" - "boostActivatedAt"))/86400), 1) as avg_duration_days
FROM "Job" 
WHERE "isBoosted" = true 
GROUP BY "boostType"
ORDER BY usage_count DESC;
```

## ✅ Success Criteria

### Deployment Success Indicators:
- [ ] All environment variables configured
- [ ] Database migration completed without errors
- [ ] Test payment completes successfully
- [ ] Job boost activation works in UI
- [ ] Webhook endpoints respond correctly
- [ ] No error spikes in monitoring
- [ ] Database constraints prevent invalid data

### Performance Benchmarks:
- Payment processing time: < 3 seconds
- Boost activation time: < 1 second  
- Database query performance: < 100ms
- API response time: < 500ms

---

## 🆘 Emergency Contacts

**Database Issues**: DBA Team  
**Payment Issues**: Stripe Support  
**Application Issues**: Development Team  
**Infrastructure Issues**: DevOps Team

**Emergency Rollback Authority**: Senior Engineering Lead

---

*This deployment guide was generated during the boost payment feature implementation. Update this document as the feature evolves.*