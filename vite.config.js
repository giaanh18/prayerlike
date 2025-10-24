import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: 3000,
    proxy: {
      '/auth': {
        target: 'https://pray-api.yalinelena.church',
        changeOrigin: true,
        secure: false
      },
      '/cms': {
        target: 'https://zien.54ucl.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})

