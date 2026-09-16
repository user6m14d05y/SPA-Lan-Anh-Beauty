import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,         // cho phép truy cập từ bên ngoài Docker container
    port: 5173,         // cổng host
    allowedHosts: true, // Cho phép tất cả hostname / subdomain truy cập
    watch: {
      usePolling: true, // quan trọng khi chạy Docker
      interval: 500,
      binaryInterval: 500
    }
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
  }
})
