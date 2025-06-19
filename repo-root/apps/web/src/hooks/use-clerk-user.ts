'use client'

// Safe Clerk hook for development without valid keys
export function useClerkUser() {
  try {
    const { useUser, useAuth, useClerk } = require('@clerk/nextjs')
    const { user, isLoaded: userLoaded, isSignedIn } = useUser()
    const { userId, sessionId, getToken, isLoaded: authLoaded } = useAuth()
    const { signOut, openSignIn, openSignUp } = useClerk()

    const displayName = user?.firstName 
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user?.username || 'User'

    const initials = user?.firstName && user?.lastName
      ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
      : user?.firstName
      ? user.firstName.substring(0, 2).toUpperCase()
      : 'U'

    const avatar = user?.imageUrl || null

    return {
      // User data
      user,
      userId,
      sessionId,
      displayName,
      initials,
      avatar,
      email: user?.emailAddresses?.[0]?.emailAddress,
      
      // Status flags
      isLoaded: userLoaded && authLoaded,
      isSignedIn,
      
      // Actions
      signOut,
      openSignIn,
      openSignUp,
      getToken,
    }
  } catch {
    // Return mock data for development
    return {
      user: null,
      userId: null,
      sessionId: null,
      displayName: 'Guest',
      initials: 'G',
      avatar: null,
      email: null,
      isLoaded: true,
      isSignedIn: false,
      signOut: () => {},
      openSignIn: () => {},
      openSignUp: () => {},
      getToken: async () => null,
    }
  }
}