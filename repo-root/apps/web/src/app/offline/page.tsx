'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  WifiOff, RefreshCw, Home, Search, Calculator, 
  Bookmark, Clock, AlertCircle, CheckCircle
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@locumtruerate/ui'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { NetworkMonitor, OfflineQueue, DataSync } from '@/lib/offline'

export default function OfflinePage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(true)
  const [queueLength, setQueueLength] = useState(0)
  const [cachedData, setCachedData] = useState({
    jobs: 0,
    profile: false,
    applications: 0,
    savedJobs: 0
  })
  
  useEffect(() => {
    // Check network status
    setIsOnline(NetworkMonitor.isOnline())
    
    // Listen for network changes
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online)
    }
    
    NetworkMonitor.addListener(handleNetworkChange)
    
    // Check offline queue
    setQueueLength(OfflineQueue.getQueueLength())
    
    // Check cached data
    const jobs = DataSync.getCachedJobs()
    const profile = DataSync.getCachedUserProfile()
    const applications = DataSync.getCachedApplications()
    const savedJobs = DataSync.getCachedSavedJobs()
    
    setCachedData({
      jobs: jobs?.length || 0,
      profile: !!profile,
      applications: applications?.length || 0,
      savedJobs: savedJobs?.length || 0
    })
    
    return () => {
      NetworkMonitor.removeListener(handleNetworkChange)
    }
  }, [])
  
  const handleRetry = async () => {
    if (isOnline) {
      router.back()
    } else {
      // Try to refresh the page
      window.location.reload()
    }
  }
  
  const offlineFeatures = [
    {
      title: 'Browse Cached Jobs',
      description: `View ${cachedData.jobs} previously loaded job listings`,
      icon: Search,
      available: cachedData.jobs > 0,
      action: () => router.push('/search/jobs')
    },
    {
      title: 'Use Calculator',
      description: 'Calculate contract rates and compensation offline',
      icon: Calculator,
      available: true,
      action: () => router.push('/tools/calculator')
    },
    {
      title: 'View Saved Jobs',
      description: `Access ${cachedData.savedJobs} saved job listings`,
      icon: Bookmark,
      available: cachedData.savedJobs > 0,
      action: () => router.push('/dashboard/saved-jobs')
    },
    {
      title: 'View Applications',
      description: `Check ${cachedData.applications} recent applications`,
      icon: Clock,
      available: cachedData.applications > 0,
      action: () => router.push('/dashboard/applications')
    }
  ]
  
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Status Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="flex items-center justify-center mb-6">
              {isOnline ? (
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <WifiOff className="h-12 w-12 text-orange-600 dark:text-orange-400" />
                </div>
              )}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {isOnline ? 'Back Online!' : 'You\'re Offline'}
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {isOnline 
                ? 'Your connection has been restored. You can now access all features.'
                : 'No internet connection detected. Some features are still available offline.'}
            </p>
            
            {/* Connection Status */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Badge variant={isOnline ? 'green' : 'yellow'} className="px-4 py-2">
                {isOnline ? 'Connected' : 'Offline Mode'}
              </Badge>
              
              {queueLength > 0 && (
                <Badge variant="blue" className="px-4 py-2">
                  {queueLength} actions queued
                </Badge>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {isOnline ? 'Return to Previous Page' : 'Try Again'}
              </Button>
              
              <Button variant="outline" onClick={() => router.push('/')}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>
          </motion.div>
          
          {/* Offline Features */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                Available Offline
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {offlineFeatures.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                    >
                      <Card className={`h-full ${feature.available ? 'cursor-pointer hover:shadow-lg transition-shadow' : 'opacity-50'}`}
                            onClick={feature.available ? feature.action : undefined}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full ${
                              feature.available 
                                ? 'bg-blue-100 dark:bg-blue-900/30' 
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                feature.available 
                                  ? 'text-blue-600 dark:text-blue-400' 
                                  : 'text-gray-400'
                              }`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{feature.title}</CardTitle>
                              {feature.available && (
                                <Badge variant="green" size="sm" className="mt-1">
                                  Available
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-600 dark:text-gray-400">
                            {feature.description}
                          </p>
                          {!feature.available && (
                            <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 flex items-center gap-1">
                              <AlertCircle className="h-4 w-4" />
                              No cached data available
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
          
          {/* Tips for Offline Use */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
                Tips for Offline Use
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Your actions are saved and will sync when you\'re back online</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Previously viewed content remains available</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>The calculator works fully offline</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Saved jobs and applications can be viewed offline</span>
                </li>
              </ul>
            </motion.div>
          )}
          
          {/* Queue Status */}
          {queueLength > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100">
                  Pending Actions ({queueLength})
                </h3>
              </div>
              <p className="text-yellow-800 dark:text-yellow-200">
                {queueLength} action{queueLength !== 1 ? 's' : ''} will be processed when your connection is restored.
              </p>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}