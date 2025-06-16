/**
 * Vitest setup for database tests
 */

import { beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { GenericContainer, StartedTestContainer } from 'testcontainers';

// Global test state
let postgres: StartedTestContainer;
let prisma: PrismaClient;

// Setup test database container before all tests
beforeAll(async () => {
  // Start PostgreSQL container for testing
  postgres = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_DB: 'locumtruerate_test',
      POSTGRES_USER: 'postgres',
      POSTGRES_PASSWORD: 'postgres',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(
      require('testcontainers').Wait.forLogMessage('database system is ready to accept connections')
    )
    .start();

  const host = postgres.getHost();
  const port = postgres.getMappedPort(5432);
  const databaseUrl = `postgresql://postgres:postgres@${host}:${port}/locumtruerate_test`;

  // Set test database URL
  process.env.DATABASE_URL = databaseUrl;

  // Initialize Prisma client
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  // Apply database schema
  await import('child_process').then(({ execSync }) => {
    execSync('npx prisma db push --force-reset', {
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'inherit',
    });
  });

  // Connect to database
  await prisma.$connect();
}, 60000); // 60 second timeout for container startup

// Clean database between tests
beforeEach(async () => {
  // Clean all tables in reverse dependency order
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
    } catch (error) {
      console.log('Error truncating tables:', error);
    }
  }
});

// Cleanup after each test
afterEach(async () => {
  // Reset any mocks or test state if needed
});

// Cleanup after all tests
afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  if (postgres) {
    await postgres.stop();
  }
});

// Export utilities for tests
export { prisma };

// Global test utilities for database tests
export const testUtils = {
  // Create test user
  createUser: async (overrides: any = {}) => {
    return await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'EMPLOYER',
        emailVerified: new Date(),
        ...overrides,
      },
    });
  },

  // Create test job
  createJob: async (employerId: string, overrides: any = {}) => {
    return await prisma.job.create({
      data: {
        title: 'Test Job',
        company: 'Test Company',
        location: 'Test Location',
        description: 'Test job description',
        requirements: ['Test requirement'],
        benefits: ['Test benefit'],
        salaryMin: 100000,
        salaryMax: 150000,
        employmentType: 'FULL_TIME',
        specialty: 'EMERGENCY_MEDICINE',
        status: 'ACTIVE',
        employerId,
        ...overrides,
      },
    });
  },

  // Create test application
  createApplication: async (jobId: string, candidateId: string, overrides: any = {}) => {
    return await prisma.application.create({
      data: {
        jobId,
        candidateId,
        status: 'PENDING',
        coverLetter: 'Test cover letter',
        ...overrides,
      },
    });
  },

  // Create test subscription
  createSubscription: async (userId: string, overrides: any = {}) => {
    return await prisma.subscription.create({
      data: {
        userId,
        stripeSubscriptionId: 'sub_test123',
        stripePriceId: 'price_test123',
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        plan: 'PREMIUM',
        ...overrides,
      },
    });
  },

  // Create test payment
  createPayment: async (userId: string, overrides: any = {}) => {
    return await prisma.payment.create({
      data: {
        userId,
        stripePaymentIntentId: 'pi_test123',
        amount: 10000, // $100.00
        currency: 'USD',
        status: 'SUCCEEDED',
        description: 'Test payment',
        ...overrides,
      },
    });
  },

  // Clean specific tables
  cleanTable: async (tableName: string) => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`);
  },

  // Count records in table
  countRecords: async (tableName: string) => {
    const result = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM "${tableName}"`);
    return parseInt((result as any)[0].count);
  },

  // Wait for database changes to propagate
  waitForChanges: async (ms: number = 100) => {
    await new Promise(resolve => setTimeout(resolve, ms));
  },
};