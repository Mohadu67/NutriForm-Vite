import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/harmonith\.fr\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'harmonith-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
              }
            }
          }
        ]
      },
      manifest: {
        name: 'Harmonith - Coach Sportif en Ligne',
        short_name: 'Harmonith',
        description: 'Calculateur IMC, calories et programme d\'entraînement personnalisé',
        theme_color: '#B5EAD7',
        background_color: '#F7F6F2',
        display: 'standalone',
        icons: [
          {
            src: '/assets/icons/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    }
  }
})
