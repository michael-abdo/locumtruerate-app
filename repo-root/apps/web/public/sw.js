// Service Worker for LocumTrueRate
// Provides offline functionality and caching

const CACHE_NAME = 'locumtruerate-v1'
const OFFLINE_URL = '/offline'

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/search/jobs',
  '/tools/calculator',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
]

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network (for static assets)
  CACHE_FIRST: 'cache-first',
  // Network first, then cache (for dynamic content)
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate (for frequently updated content)
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
}

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Precaching assets')
        return cache.addAll(PRECACHE_ASSETS)
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Service Worker: Precache failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return
  }
  
  // Skip API requests for special handling
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
    return
  }
  
  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request))
    return
  }
  
  // Handle static assets
  if (isStaticAsset(url)) {
    event.respondWith(handleStaticAsset(request))
    return
  }
  
  // Default: network first
  event.respondWith(handleDefault(request))
})

// Handle API requests with offline queue
async function handleApiRequest(request) {
  try {
    const response = await fetch(request)
    
    // Cache successful GET requests
    if (request.method === 'GET' && response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // If request fails and it's a GET request, try cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
    }
    
    // For non-GET requests, queue for later
    if (request.method !== 'GET') {
      await queueFailedRequest(request)
    }
    
    throw error
  }
}

// Handle navigation requests (page loads)
async function handleNavigationRequest(request) {
  try {
    // Always try network first for navigation
    const networkResponse = await fetch(request)
    
    // Cache successful navigation responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // If no cache, return offline page
    const offlineResponse = await caches.match(OFFLINE_URL)
    return offlineResponse || new Response('Offline', { status: 503 })
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // If not in cache, fetch from network
    const networkResponse = await fetch(request)
    
    // Cache the response
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Asset not available offline', { status: 503 })
  }
}

// Default handler - network first with cache fallback
async function handleDefault(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Try cache as fallback
    const cachedResponse = await caches.match(request)
    return cachedResponse || new Response('Content not available offline', { status: 503 })
  }
}

// Queue failed requests for retry when online
async function queueFailedRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text(),
      timestamp: Date.now()
    }
    
    // Store in IndexedDB or send message to main thread
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'QUEUE_REQUEST',
          data: requestData
        })
      })
    })
  } catch (error) {
    console.error('Failed to queue request:', error)
  }
}

// Helper functions
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf']
  return staticExtensions.some(ext => url.pathname.endsWith(ext))
}

// Background sync for queued requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processQueuedRequests())
  }
})

async function processQueuedRequests() {
  // This would process queued requests when back online
  // Integration with main app's offline queue
  console.log('Processing queued requests in background')
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: data.data
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If not, open a new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen)
        }
      })
  )
})

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_UPDATE':
      // Handle cache updates from main thread
      updateCache(data)
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

async function updateCache(data) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const { url, response } = data
    
    if (url && response) {
      await cache.put(url, new Response(response))
    }
  } catch (error) {
    console.error('Failed to update cache:', error)
  }
}