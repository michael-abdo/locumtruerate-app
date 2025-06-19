import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { jobsRouter } from './routers/jobs';
import { applicationsRouter } from './routers/applications';
import { usersRouter } from './routers/users';
import { searchRouter } from './routers/search';
import { adminRouter } from './routers/admin';
import { analyticsRouter } from './routers/analytics';
import { supportRouter } from './routers/support';
import { calculationsRouter } from './routers/calculations';
import { leadsRouter } from './routers/leads';
import { paymentsRouter } from './routers/payments';
import { leadMarketplaceRouter } from './routers/lead-marketplace';
import { API_VERSION } from './versioning';
// import { companiesRouter } from './routers/companies';
// import { organizationsRouter } from './routers/organizations';
// import { notificationsRouter } from './routers/notifications';
// import { billingRouter } from './routers/billing';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  users: usersRouter,
  search: searchRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  support: supportRouter,
  calculations: calculationsRouter,
  leads: leadsRouter,
  payments: paymentsRouter,
  leadMarketplace: leadMarketplaceRouter,
  // companies: companiesRouter,
  // organizations: organizationsRouter,
  // notifications: notificationsRouter,
  // billing: billingRouter,
  
  // Version endpoint
  version: {
    get: {
      query: () => ({
        current: API_VERSION.current,
        supported: Object.values(API_VERSION).filter(v => typeof v === 'string' && !API_VERSION.deprecated.includes(v)),
        deprecated: API_VERSION.deprecated,
      }),
    },
  },
});

export type AppRouter = typeof appRouter;

// Export context and other utilities
export { createContext, type Context } from './context';
export { createCallerFactory } from './trpc';

// Export individual routers for testing
export { authRouter, jobsRouter, applicationsRouter, usersRouter, leadsRouter };