import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { jobsRouter } from './routers/jobs';
import { applicationsRouter } from './routers/applications';
import { usersRouter } from './routers/users';
import { searchRouter } from './routers/search';
import { adminRouter } from './routers/admin';
import { analyticsRouter } from './routers/analytics';
// import { companiesRouter } from './routers/companies';
// import { organizationsRouter } from './routers/organizations';
// import { notificationsRouter } from './routers/notifications';
// import { billingRouter } from './routers/billing';
// import { supportRouter } from './routers/support';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  jobs: jobsRouter,
  applications: applicationsRouter,
  users: usersRouter,
  search: searchRouter,
  admin: adminRouter,
  analytics: analyticsRouter,
  // companies: companiesRouter,
  // organizations: organizationsRouter,
  // notifications: notificationsRouter,
  // billing: billingRouter,
  // support: supportRouter,
});

export type AppRouter = typeof appRouter;

// Export context and other utilities
export { createContext, type Context } from './context';
export { createCallerFactory } from './trpc';

// Export individual routers for testing
export { authRouter, jobsRouter, applicationsRouter, usersRouter };