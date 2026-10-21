import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      {
        name: 'disable-vite-hmr-websocket',
        enforce: 'post',
        transform(code, id) {
          if (id.includes('vite/dist/client/client.mjs')) {
            return code.replace(
              /const createWebSocketModuleRunnerTransport = \([^)]*\) => \{[\s\S]*?\/\/#endregion/,
              'const createWebSocketModuleRunnerTransport = () => ({ async connect() {}, disconnect() {}, send() {} });\n//#endregion'
            );
          }
          return null;
        },
      },
      {
        name: 'sync-live-bundle',
        closeBundle() {
          try {
            const distAssetsDir = path.resolve(import.meta.dirname, 'dist/assets');
            const liveBundleDir = path.resolve(import.meta.dirname, 'live-bundle');
            if (!fs.existsSync(distAssetsDir)) return;
            if (!fs.existsSync(liveBundleDir)) {
              fs.mkdirSync(liveBundleDir, {recursive: true});
            }
            const files = fs.readdirSync(distAssetsDir);
            const jsFile = files.find((f) => f.startsWith('index-') && f.endsWith('.js'));
            const cssFile = files.find((f) => f.startsWith('index-') && f.endsWith('.css'));
            if (jsFile) {
              fs.copyFileSync(path.join(distAssetsDir, jsFile), path.join(liveBundleDir, 'app.js'));
            }
            if (cssFile) {
              fs.copyFileSync(path.join(distAssetsDir, cssFile), path.join(liveBundleDir, 'app.css'));
            }
          } catch (err) {
            console.warn('Failed to sync live-bundle:', err);
          }
        },
      },
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        manifest: {
          id: './',
          name: 'Ai Rent · Sistem Manajemen Rental Motor',
          short_name: 'Ai Rent',
          description: 'Aplikasi manajemen operasional & pemesanan mandiri rental motor Ai Rent untuk Smartphone Android & iOS.',
          theme_color: '#020617',
          background_color: '#020617',
          display: 'standalone',
          orientation: 'portrait',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg,jpg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 2500,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: false,
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

