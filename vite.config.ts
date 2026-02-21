import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '对象分析系统 - Love Ops',
        short_name: 'Love Ops',
        description: '相亲约会记录与分析',
        theme_color: '#c45c3e',
        background_color: '#faf8f5',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            type: 'image/svg+xml',
            sizes: 'any',
            purpose: 'any maskable',
          },
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
