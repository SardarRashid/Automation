import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 5000000,
        // Force new service worker to activate immediately on next deploy
        // — no manual cache-clear or tab-close required
        skipWaiting: true,
        clientsClaim: true,
        // Keep Firebase RTDB responses cached for offline use (NetworkFirst = live data
        // is preferred, but falls back to cache if offline — data is NEVER cleared by SW updates)
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.firebasedatabase\.app\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-rtdb-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'Inventory & Scanner Suite',
        short_name: 'Automation',
        description: 'Inventory Management and Scanner Administration',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: { sourcemap: true },
  server: {
    port: 5175,
    strictPort: true,
  }
})
