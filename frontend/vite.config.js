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
  }
})
