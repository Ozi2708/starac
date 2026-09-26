import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['key-art.jpg', 'favicon-v3.png', 'apple-touch-icon-v3.png'],
      manifest: {
        name: 'Le Grand Prono · Star Academy 2026',
        short_name: 'Grand Prono',
        description: 'Une saison. Des pronos. Un seul gagnant. Jeu entre amis, sans argent.',
        lang: 'fr',
        theme_color: '#0d0322',
        background_color: '#0d0322',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icon-192-v3.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512-v3.png', sizes: '512x512', type: 'image/png' },
          // Android : icône « maskable » plein cadre (sinon Android l'entoure d'un cadre blanc)
          { src: 'icon-maskable-192-v3.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icon-maskable-512-v3.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Les données Supabase ne sont jamais servies depuis le cache (pas de faux « enregistré »)
        runtimeCaching: [
          { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/, handler: 'CacheFirst', options: { cacheName: 'fonts', expiration: { maxEntries: 20 } } },
        ],
      },
    }),
  ],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'], setupFiles: ['src/test/setup.ts'], css: false },
});
