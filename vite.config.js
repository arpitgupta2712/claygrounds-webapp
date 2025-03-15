import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devOptimizations } from './src/vite/devOptimizations'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Optimize React Fast Refresh
      fastRefresh: true,
    }),
    devOptimizations()
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
  },
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    // Optimize HMR
    hmr: {
      overlay: true,
    },
    // Watch config
    watch: {
      usePolling: false,
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'chart.js',
      'react-chartjs-2',
      'jspdf',
      'papaparse'
    ]
  },
  // Cache configuration
  cacheDir: 'node_modules/.vite',
})
