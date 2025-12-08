import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    ssr: true,
    outDir: 'dist/server',
    rollupOptions: {
      input: './src/entry-server.jsx',
      output: {
        format: 'es',
        entryFileNames: 'entry-server.js'
      }
    }
  },
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
  ssr: {
    noExternal: [
      'react-bootstrap',
      'bootstrap-icons',
      '@dr.pogodin/react-helmet',
      'react-helmet',
      'react-icons'
    ],
    external: [
      'leaflet',
      'react-leaflet',
      '@microsoft/clarity',
      'socket.io-client',
      'html2canvas'
    ]
  }
})
