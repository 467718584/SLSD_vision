import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8501',
        changeOrigin: true
      },
      '/data': {
        target: 'http://localhost:8501',
        changeOrigin: true
      }
    }
  }
})
