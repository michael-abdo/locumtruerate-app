import { inferAsyncReturnType } from '@trpc/server';
import { PrismaClient } from '@locumtruerate/database';
// Simple logger to avoid complex shared logger issues
const logger = {
  debug: console.debug,
  info: console.log,
  warn: console.warn,
  error: console.error,
  fatal: console.error,
};

const db = new PrismaClient();

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

export type Context = inferAsyncReturnType<typeof createContext>;