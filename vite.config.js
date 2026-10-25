import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Tickler',
        short_name: 'Tickler',
        description: 'Your personal and family task assistant.',
        theme_color: '#4f46e5',
        background_color: '#f7f7fb',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Keep profile photos available offline once they have been seen.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/photo-/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'profile-photos',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // No service worker in development: it rebuilt on every edit and kept
      // showing "A new version is available". Production builds still get it.
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
