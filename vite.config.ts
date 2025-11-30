import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import faceApiCdnPlugin from './vite-plugin-face-api.js';
import claudeApiPlugin from './vite-plugin-claude-api';

export default defineConfig({
  plugins: [react(), faceApiCdnPlugin(), claudeApiPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['ethers', 'wagmi', 'viem', '@reown/appkit', 'three']
  },
  resolve: {
    alias: {
      'bn.js': 'bn.js/lib/bn.js'
    }
  },
  server: {
    host: '0.0.0.0',
    // Use a fixed port to avoid auto-switching and HMR reconnect loops in dev
    port: 5178,
    strictPort: true,
    hmr: {
      // Align HMR websocket port with the dev server
      clientPort: 5178,
      host: 'localhost',
      protocol: 'ws',
      timeout: 120000
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  },
  preview: {
    port: 5178,
    strictPort: true,
    host: true
  },
  esbuild: {
    // Strip debugger statements in production; console.log is kept for now to aid debugging
    // To fully strip console: drop: ['console', 'debugger']
    drop: process.env.NODE_ENV === 'production' ? ['debugger'] : [],
    // Optionally, use pure to strip only console.log while keeping error/warn:
    pure: process.env.NODE_ENV === 'production' ? ['console.log'] : []
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable to save memory during build
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
          web3: ['ethers', 'wagmi', 'viem', '@reown/appkit', '@reown/appkit-adapter-wagmi'],
          ui: ['lucide-react', 'recharts', 'mapbox-gl', 'react-map-gl'],
          three: ['three']
        }
      }
    }
  }
});
