import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';
import { authMiddleware, rateLimitMiddleware, analyticsMiddleware } from './middleware';

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? error.cause.issues
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(analyticsMiddleware);

export const protectedProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(analyticsMiddleware)
  .use(authMiddleware);

// Admin procedure that requires admin role
export const adminProcedure = t.procedure
  .use(rateLimitMiddleware)
  .use(analyticsMiddleware)
  .use(authMiddleware)
  .use(async (opts) => {
    const { ctx } = opts;
    
    // Check if user has admin role
    if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'super_admin') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Admin access required'
      });
    }
    
    return opts.next();
  });

export const createCallerFactory = t.createCallerFactory;