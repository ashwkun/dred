const CACHE_NAME = 'dred-v5-google-bypass';
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
  const url = event.request.url;
  
  // Skip ALL external Google/Firebase services - let browser handle them directly
  // This prevents CSP violations and OAuth issues
  if (url.includes('google-analytics.com') || 
      url.includes('googletagmanager.com') ||
      url.includes('overbridgenet.com') ||
      url.includes('firestore.googleapis.com') ||
      url.includes('firebaseio.com') ||
      url.includes('googleapis.com') ||
      url.includes('google.com') ||
      url.includes('gstatic.com') ||
      url.includes('googleusercontent.com') ||  // Google profile images
      url.includes('firebaseapp.com/__') ||
      url.includes('accounts.google.com')) {
    // Don't handle these requests at all - let them go directly to network
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