import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@locumtruerate/api'
import { auth } from '@clerk/nextjs'
import { isDevEnvironment, createDevAuthContext, createMockRequestContext } from '@/lib/dev-auth-context'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req: trpcReq }) => {
      // Use development auth context when in development with placeholder keys
      if (isDevEnvironment()) {
        const devAuth = createDevAuthContext()
        const mockRequest = createMockRequestContext()
        
        return createContext({
          userId: devAuth.userId,
          userRole: devAuth.role,
          sessionId: devAuth.sessionId,
          ipAddress: mockRequest.ipAddress,
          userAgent: mockRequest.userAgent,
        })
      }
      
      // Production: Extract user information from Clerk
      const { userId, sessionId } = auth()
      const ipAddress = trpcReq.headers.get('x-forwarded-for') || trpcReq.headers.get('x-real-ip') || 'unknown'
      const userAgent = trpcReq.headers.get('user-agent') || 'unknown'
      
      return createContext({
        userId: userId || undefined,
        sessionId: sessionId || undefined,
        ipAddress,
        userAgent,
      })
    },
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            )
          }
        : undefined,
  })

export { handler as GET, handler as POST }