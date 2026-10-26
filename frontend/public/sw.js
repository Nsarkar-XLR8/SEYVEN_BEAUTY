// SEYVEN Prestige Dermal Atelier - Offline Resilience Service Worker
// Designed for Bangladesh 3G/4G unstable network resilience

const CACHE_NAME = 'seyven-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/catalog',
  '/routine-advisory',
  '/track-order',
  '/verify-unit',
  '/images/seyven-monogram.png',
  '/images/seyven-logo.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip admin/API routes from offline cache
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/api')) {
    return;
  }

  // Network first with cache fallback strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to home if page navigation fails
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
