# Vercel Deployment Setup Guide

## 1. Create Vercel Account & Project

### Option A: Via Vercel CLI (After Authentication)
```bash
cd apps/web
vercel
# Follow prompts to create new project
```

### Option B: Via Vercel Dashboard
1. Go to https://vercel.com/new
2. Import Git Repository: `https://github.com/YOUR_USERNAME/locumtruerate`
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && npm run build:web`
   - **Output Directory**: `.next`
   - **Install Command**: `cd ../.. && npm install`
   - **Development Command**: `cd ../.. && npm run dev:web`

## 2. Environment Variables Setup

### Required Variables (Must be set for successful deployment)

Copy from `.env.vercel.example` and set in Vercel Dashboard:

**Authentication (Clerk):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

**Database:**
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `DATABASE_ENCRYPTION_KEY`

**Security:**
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `RATE_LIMIT_SECRET`
- `AUDIT_LOG_ENCRYPTION_KEY`

**Payment (Stripe):**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

**Error Tracking (Sentry):**
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

**Email (SendGrid):**
- `SENDGRID_API_KEY`

### Setting Environment Variables in Vercel

1. Go to your project dashboard
2. Click **Settings** > **Environment Variables**
3. Add each variable with appropriate values:
   - **Development**: For preview deployments
   - **Preview**: For preview deployments  
   - **Production**: For production deployment

## 3. Domain Configuration

### Custom Domain Setup
1. In Vercel Dashboard > **Settings** > **Domains**
2. Add your domain: `locumtruerate.com`
3. Configure DNS in Cloudflare:
   ```
   Type: CNAME
   Name: @
   Target: cname.vercel-dns.com
   ```

### Cloudflare Integration
Keep Cloudflare for:
- DNS management
- CDN and caching
- DDoS protection
- SSL certificates

## 4. Build Configuration

The project includes:
- ✅ `vercel.json` - Vercel configuration
- ✅ `next.config.js` - Next.js optimized for Vercel
- ✅ Monorepo build commands
- ✅ TypeScript strict mode enabled
- ✅ Security headers configured

## 5. Deployment Process

### Initial Deployment
```bash
vercel --prod
```

### Automatic Deployments
- **Preview**: Every push to any branch
- **Production**: Every push to `main` branch

## 6. Post-Deployment Checklist

### Health Checks
- [ ] Application loads successfully
- [ ] Database connectivity works
- [ ] Authentication flow works
- [ ] Payment processing works
- [ ] Error tracking active

### Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No sensitive data exposed
- [ ] HIPAA compliance maintained

### Performance Testing
- [ ] Page load times < 3s
- [ ] Core Web Vitals passing
- [ ] API responses < 500ms

## 7. Monitoring & Alerts

### Vercel Analytics
- Enable in Dashboard > **Analytics**
- Monitor Core Web Vitals
- Track deployment success rates

### External Monitoring
- Sentry for error tracking
- Database monitoring via provider
- Uptime monitoring (recommended)

## 8. Troubleshooting

### Common Issues
1. **Build fails**: Check TypeScript errors
2. **Environment variables missing**: Verify all required vars set
3. **Database connection fails**: Check connection string format
4. **Authentication issues**: Verify Clerk configuration

### Debug Deployment
```bash
vercel logs
vercel env ls
```

## 9. Rollback Strategy

### Emergency Rollback
1. In Vercel Dashboard > **Deployments**
2. Find last working deployment
3. Click **Promote to Production**

### Git-based Rollback
```bash
git revert HEAD
git push origin main
```

This will trigger automatic redeployment of previous version.