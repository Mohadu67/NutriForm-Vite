/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(async ({ mode }) => {
  // lazy/dynamic import of the app logger to avoid executing app code
  // at Vite config evaluation time (fixes "Cannot read properties of undefined (reading 'DEV')").
  let logger
  try {
    const mod = await import('./src/shared/utils/logger.js')
    logger = mod?.default ?? mod
  } catch (err) {
    // if logger cannot be imported in the build environment, provide a noop fallback
    logger = { info: () => {}, warn: () => {}, error: () => {} }
  }

  return ({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/__tests__/setup.js',
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/__tests__/',
          '**/*.test.{js,jsx}',
          '**/*.config.js',
        ],
        thresholds: {
          branches: 60,
          functions: 60,
          lines: 60,
          statements: 60,
        },
      },
    },
    build: {
      // Optimisation du bundle
      rollupOptions: {
        output: {
          manualChunks: {
            // React core et routing
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // UI libraries
            'ui-vendor': ['react-bootstrap', 'sonner', 'react-icons'],
            // Utilities
            'utils': ['axios', 'dompurify'],
            // Maps
            'leaflet': ['leaflet', 'react-leaflet'],
            // DnD
            'dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
          }
        }
      },
      // Suppression des logger.info en production
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        }
      },
      // Limite de taille des chunks
      chunkSizeWarningLimit: 500,
    },
    // Aliases pour imports plus propres
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@pages': '/src/pages',
        '@utils': '/src/utils',
        '@api': '/src/shared/api',
        '@hooks': '/src/hooks',
        '@services': '/src/services',
        '@contexts': '/src/contexts',
      }
    },
    plugins: [
      react(),
      svgr(),
      // Désactiver PWA en mode dev pour améliorer les performances
      ...(mode === 'production' ? [VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
          globIgnores: ['**/assets/icons/**'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/harmonith\.fr\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'harmonith-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
                },
                networkTimeoutSeconds: 10
              }
            }
          ]
        },
        devOptions: {
          enabled: false
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
              src: '/favicon.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/favicon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
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
      })] : [])
    ],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'axios',
        'leaflet',
        'react-leaflet',
        'dompurify',
        '@dnd-kit/core',
        '@dnd-kit/sortable'
      ]
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          cookieDomainRewrite: 'localhost'
        }
      },
      warmup: {
        clientFiles: ['./src/main.jsx', './src/App.jsx']
      }
    }
  })
})
