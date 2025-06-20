# LocumTrueRate.com - Mobile-First Cross-Platform Architecture

This is the new mobile-first, cross-platform architecture for LocumTrueRate.com, built with React/Next.js for web and React Native for mobile applications.

## Architecture Overview

This monorepo uses TurboRepo to manage multiple applications and shared packages:

### Apps
- **`apps/web`** - Next.js web application
- **`apps/mobile`** - React Native mobile application (iOS/Android)

### Packages
- **`packages/ui`** - Shared UI components (85%+ code reuse)
- **`packages/api`** - tRPC API with all business logic
- **`packages/calc-core`** - Healthcare contract calculation engines
- **`packages/database`** - Prisma ORM and database schemas
- **`packages/shared`** - Shared utilities and error handling
- **`packages/config`** - Shared configuration files
- **`packages/types`** - Shared TypeScript types and Zod schemas

## Technology Stack

### Frontend
- **Web**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Mobile**: React Native, Expo SDK 50, TypeScript
- **State**: TanStack Query, Zustand
- **UI**: Radix UI (web), Native components (mobile)

### Backend
- **API**: tRPC v10 with type-safe procedures, API versioning
- **Database**: PostgreSQL (Neon), Prisma ORM, Full-text search
- **Auth**: Dual system - JWT + Clerk (cross-platform)
- **Payments**: Stripe integration for lead marketplace and job boosts
- **Hosting**: Cloudflare Pages (web), Vercel (API)

### Security & Compliance
- **Input Validation**: Zod schemas on all 82+ components (100% coverage)
- **HIPAA Compliance**: Comprehensive data flow documentation and PHI handling
- **Production Security**: Debug logging disabled, security headers enforced
- **Monitoring**: Sentry error tracking, structured audit logging

### Development
- **Monorepo**: TurboRepo, pnpm workspaces
- **Testing**: Jest, Playwright, React Native Testing Library
- **CI/CD**: GitHub Actions with security scanning and compliance checks
- **Code Quality**: ESLint, Prettier, TypeScript

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- PostgreSQL database
- iOS/Android development environment (for mobile)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Push database schema
pnpm db:push

# Seed database (optional)
pnpm db:seed
```

### Development

```bash
# Start all apps and packages in dev mode
pnpm dev

# Start specific app
pnpm dev --filter=@locumtruerate/web
pnpm dev --filter=@locumtruerate/mobile

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

### Building

```bash
# Build all packages
pnpm build

# Build specific app
pnpm build --filter=@locumtruerate/web
```

## Mobile Development

### iOS Development
```bash
cd apps/mobile
pnpm ios
```

### Android Development
```bash
cd apps/mobile
pnpm android
```

### Building for Production
```bash
# Preview builds
pnpm build:preview --filter=@locumtruerate/mobile

# Production builds
pnpm build:production --filter=@locumtruerate/mobile
```

## Project Structure

```
repo-root/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native mobile app
├── packages/
│   ├── ui/           # Shared UI components
│   ├── api/          # tRPC API
│   ├── database/     # Prisma ORM
│   ├── config/       # Shared configs
│   └── types/        # TypeScript types
├── turbo.json        # TurboRepo config
├── pnpm-workspace.yaml
└── package.json
```

## Migration Status

This new architecture is being built to replace the existing Cloudflare Workers + vanilla HTML/CSS/JS implementation. The migration follows an incremental blue-green strategy to ensure zero downtime and no functionality loss.

### Migration Progress
- [x] Week 1: Complete infrastructure, security, and testing setup
- [x] Week 2: Complete desktop system with all production features
  - API migration to tRPC with versioning
  - Next.js 14 frontend with SSR and SEO
  - Healthcare calculation engines
  - Admin dashboard and support system
  - Legal compliance documents
- [x] **Phase B: Mobile Architecture** - Complete mobile-first development platform
  - Cross-platform React Native application
  - Offline-first architecture with SQLite sync
  - Biometric authentication and secure storage
  - Deep linking and native sharing
  - Analytics and crash reporting
  - Platform-specific optimizations
  - App store deployment pipeline

See `/docs/migration/` for detailed migration documentation.

## Key Features (Week 2 Complete)

### API & Backend
- **tRPC API** with type-safe procedures and automatic TypeScript generation
- **API Versioning** using header-based versioning (`X-API-Version`)
- **Dual Authentication** - JWT for existing system, Clerk for enhanced features
- **PostgreSQL Full-Text Search** with optimized indexing
- **Rate Limiting** with tier-based limits (Free/Pro/Enterprise)

### Frontend & UI
- **Next.js 14** with Server-Side Rendering and static optimization
- **Mobile-Responsive Design** with Tailwind CSS
- **SEO Optimized** with sitemaps, meta tags, and structured data
- **Accessibility Compliant** (WCAG 2.1 AA) with ARIA labels and keyboard navigation
- **Offline Support** with service workers and local storage strategies

### Business Features
- **Healthcare Calculation Engine** with accurate contract and paycheck calculations
- **Advanced Job Search** with location-based filtering and salary ranges
- **Pay-Per-Lead Marketplace** - Recruiters can purchase qualified leads ($10-$100) with Stripe integration
- **Job Boost System** - Premium job listing upgrades with payment processing
- **Admin Dashboard** for content moderation, user management, and marketplace analytics
- **Support System** with ticket management and knowledge base
- **Analytics Tracking** for user behavior and conversion metrics
- **Legal Compliance** with GDPR-compliant privacy policy and terms of service

### Development & Testing
- **Comprehensive Test Suite** with Jest, React Testing Library, and Playwright
- **API Documentation** with automated generation and versioning
- **Performance Monitoring** with Core Web Vitals tracking
- **Security Features** including PBKDF2 hashing, JWT tokens, and rate limiting

## Production Deployment

### Prerequisites
- Production environment variables configured (see `apps/web/.env.production.example`)
- HIPAA-compliant database hosting setup
- Stripe production keys configured
- Sentry error tracking enabled

### Deployment Process
```bash
# Run production readiness validation
./scripts/production-deploy.sh

# Verify all security checks pass
npm run security:scan
npm run compliance:check

# Deploy to staging first
npm run deploy:staging

# After validation, deploy to production
npm run deploy:production
```

### Security & Compliance
- All 82+ components secured with input validation
- HIPAA compliance documentation in `/docs/HIPAA-COMPLIANCE.md`
- CI/CD pipeline with automated security scanning
- Production logging disabled for security

## Contributing

Please read our contributing guidelines before submitting PRs.

## License

Private and confidential - LocumTrueRate.com