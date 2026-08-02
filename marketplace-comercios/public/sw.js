// Minimal service worker — intentionally a no-op beyond registration.
// Its only purpose is to satisfy PWA "installability" criteria on Chromium
// (a controlling service worker with a fetch handler is required for the
// beforeinstallprompt event to fire). This does NOT implement offline
// support or caching — that is explicitly out of scope for now.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
