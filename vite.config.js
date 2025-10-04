import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Dred - Card Manager',
        short_name: 'Dred',
        description: 'Securely manage your credit and debit cards',
        theme_color: '#2A2A72',
        background_color: '#2A2A72',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        sourcemap: false // Don't generate sourcemaps in production
      },
      devOptions: {
        enabled: true
      }
    }),
  ],

  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,        // Remove all console.* in production
        drop_debugger: true,       // Remove debugger statements
        pure_funcs: [
          'console.log',
          'console.debug',
          'console.info',
          'console.warn'
        ]
      },
      mangle: {
        safari10: true
      }
    },
    sourcemap: false,  // Don't generate sourcemaps in production
    rollupOptions: {
      output: {
        manualChunks: {
          'crypto': ['crypto-js'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
}); 