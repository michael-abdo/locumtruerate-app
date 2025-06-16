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

export const createCallerFactory = t.createCallerFactory;