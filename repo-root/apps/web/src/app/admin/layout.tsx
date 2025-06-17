import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId, sessionClaims } = auth()
  
  // Check if user is authenticated
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Check if user has admin role
  const userRole = sessionClaims?.metadata?.role || sessionClaims?.role
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  )
}