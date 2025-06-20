import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { appRouter, createContext } from '@locumtruerate/api'
import { auth } from '@clerk/nextjs'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: ({ req: trpcReq }) => {
      // Development mode detection
      const isDevelopment = process.env.NODE_ENV === 'development'
      const hasPlaceholderKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.includes('placeholder')
      
      let userId: string | null = null
      let sessionId: string | null = null
      
      if (isDevelopment && hasPlaceholderKeys) {
        // Use development user when in dev mode with placeholder keys
        userId = 'dev_user_123'
        sessionId = 'dev_session_123'
      } else {
        // Extract user information from Clerk in production
        const authData = auth()
        userId = authData.userId
        sessionId = authData.sessionId
      }
      
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