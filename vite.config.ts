import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { getAcoptimizerBackend } from './backend/acoptimizerBackend.ts'

function acoptimizerBackendPlugin(): Plugin {
  return {
    name: 'acoptimizer-backend-api',
    configureServer(server) {
      const backend = getAcoptimizerBackend()
      server.middlewares.use((req, res, next) => {
        void backend.handleHttpRequest(req, res, next)
      })
    },
    configurePreviewServer(server) {
      const backend = getAcoptimizerBackend()
      server.middlewares.use((req, res, next) => {
        void backend.handleHttpRequest(req, res, next)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    acoptimizerBackendPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1300,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) {
            return 'vendor-three'
          }
          if (id.includes('node_modules/@react-three') || id.includes('node_modules/three-stdlib')) {
            return 'vendor-r3f'
          }
          if (id.includes('node_modules/mqtt')) {
            return 'vendor-mqtt'
          }
        },
      },
    },
  },
})
