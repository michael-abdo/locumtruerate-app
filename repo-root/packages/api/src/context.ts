import { inferAsyncReturnType } from '@trpc/server';
import { PrismaClient } from '@locumtruerate/database';
import { BaseLogger } from '@locumtruerate/shared';

const db = new PrismaClient();
const logger = new BaseLogger('api');

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