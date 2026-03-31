/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from "vite-plugin-svgr";

export default defineConfig(async ({ mode }) => {
  // lazy/dynamic import of the app logger to avoid executing app code
  // at Vite config evaluation time (fixes "Cannot read properties of undefined (reading 'DEV')").
  try {
    await import('./src/shared/utils/logger.js')
  } catch {
    // if logger cannot be imported in the build environment, continue silently
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
          manualChunks(id) {
            // Vendor chunks - separés pour meilleur caching
            if (id.includes('node_modules')) {
              // React core DOIT être dans le même chunk que react-dom
              if (id.includes('/react/') || id.includes('react-dom') || id.includes('react-router') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-ui';
              }
              // leaflet sans react-leaflet (react-leaflet reste dans le bundle principal)
              if (id.includes('leaflet') && !id.includes('react-leaflet')) {
                return 'vendor-maps';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('socket.io')) {
                return 'vendor-socket';
              }
            }
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
      // PWA complètement désactivé - utilise sw.js manuel + manifest.webmanifest manuel dans public/
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
      },
      // Fix pour Safari HMR
      hmr: {
        overlay: false
      }
    },
    // Forcer esbuild pour une meilleure compatibilité Safari
    esbuild: {
      target: 'es2020'
    }
  })
})
