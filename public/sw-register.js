// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        new URL('./serviceWorker.js', import.meta.url),
        { scope: './' }
      );
      console.log('ServiceWorker registration successful with scope:', registration.scope);

      // Force update check
      registration.update();

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');
        
        newWorker.addEventListener('statechange', () => {
          console.log('Service Worker state:', newWorker.state);
        });
      });

    } catch (err) {
      console.error('ServiceWorker registration failed:', err);
    }
  });
}

