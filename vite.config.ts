import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'assets/kenney/**/*.png', 'assets/illustrations/*.svg', 'assets/twemoji/*.svg', 'assets/twemoji/CREDITS.md', 'assets/twemoji/LICENSE-GRAPHICS'],
      manifest: {
        name: '키즈에듀 - 유아 학습',
        short_name: '키즈에듀',
        description: '4~5세 유아를 위한 숫자, 한글, 영어 학습 앱',
        theme_color: '#4A90D9',
        background_color: '#FFF8E7',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globIgnores: ['**/mediapipe/**'],
        runtimeCaching: [
          {
            urlPattern: /\/mediapipe\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mediapipe-model-runtime',
              expiration: { maxEntries: 8, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            // 640 voice clips (~2.6 MB) are too many to precache up front; each one
            // is kept once it has been heard, so a tablet offline still talks.
            urlPattern: /\/assets\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'voice-clips',
              expiration: { maxEntries: 800, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\.(?:woff2?|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
            },
          },
        ],
      },
    }),
  ],
  build: { rollupOptions: { output: { manualChunks: { animation: ['motion'], validation: ['zod'] } } } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
