import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Beget Production Configuration
export default defineConfig({
  plugins: [react()],
  base: '/',
  
  // Build configuration optimized for Beget
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          icons: ['@ant-design/icons'],
          query: ['@tanstack/react-query'],
          router: ['react-router-dom'],
          utils: ['axios', 'dayjs']
        }
      }
    },
    
    // Terser options for better compression
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  
  // Server configuration for Beget
  server: {
    port: 5201,
    host: '0.0.0.0',
    https: false, // SSL will be handled by Beget proxy
    
    proxy: {
      '/api': {
        target: 'https://kasuf.xyz:5200',
        changeOrigin: true,
        secure: true
      }
    }
  },
  
  // Preview configuration (for testing on Beget)
  preview: {
    port: 5201,
    host: '0.0.0.0',
    https: false
  },
  
  // Environment variables
  define: {
    'process.env.NODE_ENV': '"production"',
    'process.env.VITE_DOMAIN': '"kasuf.xyz"',
    'process.env.VITE_API_URL': '"https://kasuf.xyz:5200/api"'
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  
  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
})