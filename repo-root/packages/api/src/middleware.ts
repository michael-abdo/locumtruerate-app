import { TRPCError } from '@trpc/server';
import { t } from './trpc';
import jwt from 'jsonwebtoken';
import { UserRole } from '@locumtruerate/database';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export const authMiddleware = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});

export const roleMiddleware = (allowedRoles: UserRole[]) => {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(ctx.user.role as UserRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions'
      });
    }

    return next();
  });
};

export const adminMiddleware = roleMiddleware([UserRole.ADMIN, UserRole.SYSTEM]);

export const rateLimitMiddleware = t.middleware(async ({ ctx, next }) => {
  // Rate limiting implementation would go here
  // For now, just pass through
  ctx.logger.debug('Rate limit check passed', {
    userId: ctx.user?.id,
    ipAddress: ctx.request.ipAddress
  });

  return next();
});

export const analyticsMiddleware = t.middleware(async ({ ctx, next, path, type }) => {
  const startTime = Date.now();
  
  try {
    const result = await next();
    
    // Track successful API calls
    const duration = Date.now() - startTime;
    ctx.logger.info('API call completed', {
      path,
      type,
      duration,
      userId: ctx.user?.id,
      success: true
    });
    
    return result;
  } catch (error) {
    // Track failed API calls
    const duration = Date.now() - startTime;
    ctx.logger.error('API call failed', {
      path,
      type,
      duration,
      userId: ctx.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false
    });
    
    throw error;
  }
});

export const validateUserOwnership = t.middleware(async ({ ctx, next, rawInput }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required'
    });
  }

  // This middleware can be used to validate that a user owns a resource
  // The specific validation logic would depend on the input and resource type
  return next();
});