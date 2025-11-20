import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import removeConsole from 'vite-plugin-remove-console'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    // Remove console.log, console.warn, console.error in production
    mode === 'production' && removeConsole()
  ].filter(Boolean),
  css: {
    postcss: './postcss.config.js'
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for react and related libraries
          'react-vendor': ['react', 'react-dom'],
          // Separate chunk for large UI libraries
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          // Query library separate
          'query-vendor': ['@tanstack/react-query'],
        }
      }
    },
    // Source maps for better debugging in production
    sourcemap: mode === 'production' ? false : true,
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Minify with terser for better optimization
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      }
    }
  }
}))
