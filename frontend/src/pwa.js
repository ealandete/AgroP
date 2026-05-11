import { notifications } from '@mantine/notifications'

const SW_URL = '/service-worker.js'

export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
      updateViaCache: 'none',
    })

    console.log('SW registered:', registration.scope)

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing
      if (!installing) return

      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          notifications.show({
            title: 'Actualización disponible',
            message: 'Recarga la página para ver los cambios',
            color: 'green',
            autoClose: 10000,
            withCloseButton: true,
          })
        }
      })
    })

    return registration
  } catch (err) {
    console.error('SW registration failed:', err)
    return false
  }
}

export function setupOnlineListeners() {
  const updateOnlineStatus = () => {
    const isOnline = navigator.onLine
    document.documentElement.classList.toggle('app-offline', !isOnline)

    if (isOnline) {
      notifications.hide('offline-notification')
      notifications.show({
        id: 'online-notification',
        title: 'Conexión restablecida',
        message: 'Los datos se están sincronizando...',
        color: 'green',
        autoClose: 3000,
      })
    } else {
      notifications.show({
        id: 'offline-notification',
        title: 'Sin conexión',
        message: 'Los cambios se sincronizarán cuando vuelvas a estar en línea',
        color: 'orange',
        autoClose: false,
        withCloseButton: false,
      })
    }
  }

  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)

  if (!navigator.onLine) {
    updateOnlineStatus()
  }

  return () => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  }
}

export async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background sync not supported')
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    await registration.sync.register('sync-mutations')
    console.log('Background sync registered')
    return true
  } catch (err) {
    console.warn('Background sync registration failed:', err)
    return false
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied'

  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'

  const result = await Notification.requestPermission()
  return result
}

let swRegistration = null

export async function subscribeToPushNotifications() {
  const permission = await requestNotificationPermission()
  if (permission !== 'granted') return null

  if (!swRegistration) {
    swRegistration = await navigator.serviceWorker.ready
  }

  try {
    const subscription = await swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY || ''
      ),
    })
    return subscription
  } catch (err) {
    console.error('Push subscription failed:', err)
    return null
  }
}

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return new Uint8Array(0)
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

export function cacheMutation(url, method, headers, body) {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return

  const key = `mutation-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const request = new Request(`/agrop-mutations/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ url, method, headers, body }),
  })

  caches.open('agrop-mutations').then((cache) => {
    cache.put(request, new Response(JSON.stringify({ url, method, headers, body })))
  })
}

export function initPWA() {
  if (typeof window === 'undefined') return

  registerSW()
  setupOnlineListeners()

  try {
    registerBackgroundSync()
  } catch {
  }
}
