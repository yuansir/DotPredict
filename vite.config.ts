import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/DotPredict/',  // 添加这一行，使用仓库名作为基础路径
  server: {
    host: '127.0.0.1',
    port: 3000
  },
  optimizeDeps: {
    exclude: ['@metamask/providers']
  },
  build: {
    rollupOptions: {
      external: ['@metamask/providers']
    }
  }
})
