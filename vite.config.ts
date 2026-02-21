import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: '对象分析系统 - Love Ops',
        short_name: 'Love Ops',
        description: '相亲约会记录与分析',
        theme_color: '#c45c3e',
        background_color: '#faf8f5',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', type: 'image/png', sizes: '192x192', purpose: 'any' },
          { src: '/pwa-512x512.png', type: 'image/png', sizes: '512x512', purpose: 'any' },
          { src: '/maskable-icon-512x512.png', type: 'image/png', sizes: '512x512', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
