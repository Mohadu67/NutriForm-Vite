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
            'utils': ['axios', 'dompurify', 'i18next', 'react-i18next'],
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
      // PWA désactivé - utilise sw.js manuel + manifest.webmanifest manuel
      ...(mode === 'production' ? [VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false,
        selfDestroying: true, // Ne génère pas de SW
        manifest: false, // Utilise le manifest.webmanifest manuel dans public/
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
        'i18next',
        'react-i18next',
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
