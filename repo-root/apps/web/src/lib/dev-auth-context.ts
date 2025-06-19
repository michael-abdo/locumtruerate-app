/**
 * Development Authentication Context
 * 
 * Provides consistent mock authentication context for development environment
 * to resolve the architectural contradiction between middleware and API layers.
 */

export interface DevAuthContext {
  userId: string;
  sessionId: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function createDevAuthContext(): DevAuthContext {
  return {
    userId: "dev-user-123",
    sessionId: "dev-session-456",
    role: "USER", 
    email: "dev@locumtruerate.com",
    firstName: "Dev",
    lastName: "User"
  };
}

export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === 'development' && 
         process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder');
}

export function createMockRequestContext() {
  return {
    ipAddress: '127.0.0.1',
    userAgent: 'development-client'
  };
}