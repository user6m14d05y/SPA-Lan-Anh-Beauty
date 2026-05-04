import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,         // cho phép truy cập từ bên ngoài Docker container
    port: 5173,         // cổng host (đã match với docker-compose.yml)
    watch: {
      usePolling: true, // ✅ quan trọng khi chạy Docker
      interval: 500,      // polling mỗi 500ms (tăng giảm tùy ý)
      binaryInterval: 500
    }
  }
})
