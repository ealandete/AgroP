const CACHE_NAME = 'agrop-cache-v1'
const STATIC_CACHE = 'agrop-static-v1'
const API_CACHE = 'agrop-api-v1'
const OFFLINE_URL = '/offline.html'

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidate(request))
    return
  }

  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.match(/\.(css|js|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico)$/)
  ) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(networkFirst(request))
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return caches.match(OFFLINE_URL)
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE)
  const cached = await cache.match(request)

  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const cloned = response.clone()
      const body = await cloned.text()
      const cacheEntry = new Response(body, {
        headers: {
          'content-type': 'application/json',
          'x-sw-cache-timestamp': Date.now().toString(),
        },
      })
      cache.put(request, cacheEntry)
    }
    return response
  }).catch(() => cached)

  return cached || fetchPromise
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || caches.match(OFFLINE_URL)
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations') {
    event.waitUntil(syncMutations())
  }
})

async function syncMutations() {
  const cache = await caches.open('agrop-mutations')
  const keys = await cache.keys()
  for (const request of keys) {
    try {
      const cached = await cache.match(request)
      const mutation = await cached.json()
      await fetch(mutation.url, {
        method: mutation.method,
        headers: mutation.headers,
        body: mutation.body ? JSON.stringify(mutation.body) : undefined,
      })
      await cache.delete(request)
    } catch (err) {
      console.error('Sync failed for:', request.url, err)
    }
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()
    const options = {
      body: data.body || 'Notificación de AgroP',
      icon: '/icons/icon-192x192.png',
      badge: '/favicon.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Ver' },
        { action: 'close', title: 'Cerrar' },
      ],
    }
    event.waitUntil(
      self.registration.showNotification(data.title || 'AgroP', options)
    )
  } catch {
    event.waitUntil(
      self.registration.showNotification('AgroP', { body: event.data.text() })
    )
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'close') return
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus()
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
