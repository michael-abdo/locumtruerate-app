import { inferAsyncReturnType } from '@trpc/server';
import { PrismaClient } from '@locumtruerate/database';
import { getAuditLogger, type AuditUser } from '@locumtruerate/audit';

// Simple logger to avoid complex shared logger issues
const logger = {
  debug: console.debug,
  info: console.log,
  warn: console.warn,
  error: console.error,
  fatal: console.error,
};

const db = new PrismaClient();
const auditLogger = getAuditLogger('locumtruerate-api');

export interface CreateContextOptions {
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const createContext = (opts: CreateContextOptions) => {
  return {
    db,
    logger,
    auditLogger,
    user: opts.userId ? {
      id: opts.userId,
      role: opts.userRole,
      sessionId: opts.sessionId
    } : null,
    request: {
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent
    }
  };
};

/**
 * Convert context user to audit user format for HIPAA logging
 */
export function getAuditUser(ctx: Context): AuditUser | undefined {
  if (!ctx.user || !ctx.request) return undefined;
  
  return {
    id: ctx.user.id,
    role: ctx.user.role || 'USER',
    sessionId: ctx.user.sessionId,
    ipAddress: ctx.request.ipAddress || 'unknown',
    userAgent: ctx.request.userAgent
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;