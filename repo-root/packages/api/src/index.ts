import { createTRPCRouter, publicProcedure } from './trpc';
// import { authRouter } from './routers/auth';
// import { jobsRouter } from './routers/jobs'; // Temporarily disabled due to schema issues
// import { applicationsRouter } from './routers/applications';
// import { usersRouter } from './routers/users'; // Temporarily disabled due to schema issues
// import { searchRouter } from './routers/search';
// import { adminRouter } from './routers/admin';
// import { analyticsRouter } from './routers/analytics';
// import { supportRouter } from './routers/support'; // Temporarily disabled due to compilation issues
// import { calculationsRouter } from './routers/calculations';
// import { leadsRouter } from './routers/leads';
import { paymentsRouter } from './routers/payments';
// import { leadMarketplaceRouter } from './routers/lead-marketplace';
// import { API_VERSION } from './versioning'; // Temporarily disabled due to compilation issues
// import { companiesRouter } from './routers/companies';
// import { organizationsRouter } from './routers/organizations';
// import { notificationsRouter } from './routers/notifications';
// import { billingRouter } from './routers/billing';

export const appRouter = createTRPCRouter({
  // Minimal working API with just health check and version
  health: createTRPCRouter({
    check: publicProcedure.query(() => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    })),
  }),
  
  // Version endpoint (simplified)
  version: createTRPCRouter({
    get: publicProcedure.query(() => ({
      current: '1.0.0',
      supported: ['1.0.0'],
      deprecated: [],
    })),
  }),
  
  // Add payments functionality
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;

// Export context and other utilities
export { createContext, type Context } from './context';
export { createCallerFactory } from './trpc';

// Export individual routers for testing (minimal set)
// export { jobsRouter, usersRouter }; // Temporarily disabled