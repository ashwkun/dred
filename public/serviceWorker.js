const CACHE_NAME = 'dred-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
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
        // Return cached response if available
        if (response) {
          return response;
        }

        // If not in cache, try to fetch it
        return fetch(event.request.clone())
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            try {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  try {
                    cache.put(event.request, responseToCache);
                  } catch (error) {
                    console.error('Cache put error:', error);
                  }
                })
                .catch(error => {
                  console.error('Cache open error:', error);
                });
            } catch (error) {
              console.error('Response clone error:', error);
            }

            return response;
          })
          .catch(error => {
            console.error('Fetch error:', error);
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./offline.html');
            }
            
            // For image requests, you could return a fallback image
            if (event.request.destination === 'image') {
              // Removed fallback for logo.png, let it fail naturally if fetch fails
              // return caches.match('./logo.png'); 
            }
            
            // For other requests, just propagate the error
            throw error;
          });
      })
  );
}); 