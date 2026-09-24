import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Served from https://divtrader.github.io/hartebeesvlakte/
const base = '/hartebeesvlakte/';

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  worker: {
    format: 'es',
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Hartebeesvlakte Veldboek',
        short_name: 'Veldboek',
        description: 'Count and track the animals, birds and plants of Hartebeesvlakte in the Klein Karoo.',
        lang: 'en-ZA',
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#F4EEE2',
        theme_color: '#F4EEE2',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'family.json'],
        globIgnores: ['**/models/**'],
        // The bird sound worker bundles TensorFlow.js and is larger than Workbox's 2 MB default.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // The BirdNET model is downloaded once on request (see src/birdnet/files.ts) and then served offline.
            urlPattern: ({ url }) => url.pathname.includes('/models/birdnet/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'birdnet-model',
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            // Map tiles are cached as they are viewed, so the farm map keeps working without signal.
            urlPattern: ({ url }) =>
              url.hostname === 'server.arcgisonline.com' || url.hostname.endsWith('tile.opentopomap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 4000, maxAgeSeconds: 60 * 60 * 24 * 120 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
});
