import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3001',
      '/users': 'http://localhost:3001',
      '/org': 'http://localhost:3001',
      '/requests': 'http://localhost:3001',
      '/reports': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
})
