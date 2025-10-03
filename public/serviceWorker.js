// IMPORTANT: Update this version on every deployment to bust cache
const CACHE_VERSION = 'v' + new Date().getTime(); // Dynamic cache version
const CACHE_NAME = 'dred-' + CACHE_VERSION;
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './offline.html'
];

self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installing new version:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[ServiceWorker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activating new version:', CACHE_NAME);
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        console.log('[ServiceWorker] Deleting old caches:', cacheNames.filter(cacheName => cacheName !== CACHE_NAME));
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete all old caches, including old versions
              return cacheName.startsWith('dred-') && cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[ServiceWorker] Deleting cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
    ]).then(() => {
      console.log('[ServiceWorker] Activation complete, controlling all clients');
    })
  );
});

self.addEventListener('fetch', event => {
  // Skip Google Analytics requests and other known problematic external services
  if (event.request.url.includes('google-analytics.com') || 
      event.request.url.includes('googletagmanager.com') ||
      event.request.url.includes('overbridgenet.com')) {
    return;
  }

  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./offline.html');
        })
    );
    return;
  }

  // Network-first strategy for better freshness
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();

        // Cache the fetched response for offline use (but network is always tried first)
        caches.open(CACHE_NAME)
          .then(cache => {
            try {
              // Only cache same-origin requests
              if (event.request.url.startsWith(self.location.origin)) {
                cache.put(event.request, responseToCache);
              }
            } catch (error) {
              console.error('[ServiceWorker] Cache put error:', error);
            }
          });

        return response;
      })
      .catch(error => {
        console.log('[ServiceWorker] Fetch failed, trying cache:', event.request.url);
        // If network fails, try cache
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
            
            // For other requests, propagate the error
            throw error;
          });
      })
  );
}); 