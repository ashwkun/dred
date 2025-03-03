const CACHE_NAME = 'dred-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './logo.png',
  './offline.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
    ])
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

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        // Clone the request - fixes the 'Failed to convert value to Response' error
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.error('Cache put error:', error);
                }
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
            
            // For other requests, just propagate the error
            throw error;
          });
      })
  );
}); 