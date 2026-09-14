import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults } from 'vitest/config'
import { brand } from './src/config/brand.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: brand.name,
        short_name: brand.shortName,
        description: brand.description,
        lang: 'fr',
        theme_color: brand.colors.background,
        background_color: brand.colors.background,
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // The app is local-first (brief: everything works with zero connected
      // services) — precache the whole built app shell so it opens and
      // works offline after the first visit, not just resilient to a
      // dropped API call.
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // e2e/ is the separate Playwright suite (npm run test:e2e) — its
    // *.spec.ts files would otherwise also match Vitest's default glob
    // and collide with Playwright's own `test`/`test.describe`.
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
