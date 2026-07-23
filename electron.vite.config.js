import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve('electron/main.js'),
        formats: ['es'],
        fileName: 'index'
      },
      rollupOptions: {
        external: ['better-sqlite3', 'escpos', 'escpos-usb', 'escpos-network']
      },
      outDir: 'out/main'
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve('electron/preload/index.js'),
        formats: ['es'],
        fileName: 'index'
      },
      outDir: 'out/preload'
    }
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: resolve('index.html')
      },
      outDir: 'out/renderer'
    },
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    plugins: [react()],
    base: './'
  }
})
