import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';
import superjson from 'superjson';
// import { authMiddleware, rateLimitMiddleware, analyticsMiddleware } from './middleware'; // Temporarily disabled

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error && error.cause.name === 'ZodError'
            ? (error.cause as any).issues
            : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure;

// Admin procedure that requires admin role (simplified temporarily)
export const adminProcedure = t.procedure;

export const createCallerFactory = t.createCallerFactory;