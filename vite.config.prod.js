import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      mode === 'analyze' && visualizer({
        filename: 'dist/bundle-analysis.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: 'terser',
      
      // Optimización para producción
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: true,
          pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : []
        }
      },
      
      // Code splitting optimizado
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks separados
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['lucide-react', 'clsx', 'tailwind-merge'],
            'vendor-state': ['zustand'],
            
            // Chunks de features
            'features-pos': [
              './src/pages/POS.jsx',
              './src/hooks/useCart.js',
              './src/hooks/useOrders.js'
            ],
            'features-kitchen': [
              './src/pages/KitchenOrders.jsx'
            ],
            'features-admin': [
              './src/pages/Dashboard.jsx',
              './src/pages/Products.jsx',
              './src/pages/Inventory.jsx'
            ],
            'features-reports': [
              './src/pages/reports/SalesReports.jsx',
              './src/pages/reports/ProductReports.jsx'
            ]
          },
          
          // Nomenclatura optimizada para cache
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      
      // Límites de chunks para POS
      chunkSizeWarningLimit: 500,
      
      // Target para compatibilidad
      target: 'es2020',
      
      // Build report
      reportCompressedSize: true,
      
      // CSS optimización
      cssCodeSplit: true
    },
    
    // Variables de entorno definidas
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },
    
    // Optimización de dependencias
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@supabase/supabase-js',
        'zustand',
        'lucide-react'
      ]
    },
    
    // Configuración de desarrollo
    server: {
      host: '0.0.0.0',
      port: 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    
    // Configuración preview
    preview: {
      host: '0.0.0.0',
      port: 4173,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  }
})