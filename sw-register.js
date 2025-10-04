// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        new URL('/serviceWorker.js', import.meta.url)
      );
      console.log('ServiceWorker registration successful with scope:', registration.scope);
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });
}

