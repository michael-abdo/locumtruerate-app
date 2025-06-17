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
- **API**: tRPC, Zod validation
- **Database**: PostgreSQL (Neon), Prisma ORM
- **Auth**: Clerk (cross-platform)
- **Hosting**: Cloudflare (web), Vercel (API)

### Development
- **Monorepo**: TurboRepo, pnpm workspaces
- **Testing**: Jest, Playwright, React Native Testing Library
- **CI/CD**: GitHub Actions
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
- [x] Week 2-A: API migration to tRPC with type safety
- [x] Week 2-B: Next.js 14 frontend with mobile-first design
- [x] Week 2-C: Healthcare calculation engines implementation
- [ ] Week 2-D: Production features and admin tools (IN PROGRESS)

See `/docs/migration/` for detailed migration documentation.

## Contributing

Please read our contributing guidelines before submitting PRs.

## License

Private and confidential - LocumTrueRate.com