import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.js', // Will create this file
    globals: true,
    exclude: ['**/node_modules/**', '**/tests/**', '**/*.spec.js']
  },
  build: {
    outDir: path.resolve(__dirname, '../build'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'style.css'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://si25.timoklabbers.nl',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('[Vite Proxy] Proxying:', req.method, req.url, '->', options.target + proxyReq.path);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('[Vite Proxy] Response:', proxyRes.statusCode);
          });
        }
      }
    }
  }
})
