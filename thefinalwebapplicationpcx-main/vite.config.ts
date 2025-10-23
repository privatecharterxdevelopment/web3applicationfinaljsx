import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['ethers', 'wagmi', 'viem', '@reown/appkit']
  },
  resolve: {
    alias: {
      'bn.js': 'bn.js/lib/bn.js'
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    hmr: {
      clientPort: 5173,
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
    port: 5173,
    strictPort: false,
    host: true
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
          ui: ['lucide-react', 'recharts', 'mapbox-gl', 'react-map-gl']
        }
      }
    }
  }
});
