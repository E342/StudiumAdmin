import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_API_TARGET || 'http://localhost:3000'

  return {
    plugins: [react()],
    server: {
      port: 5174,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: true,
        },
      },
      headers: { 'Cross-Origin-Opener-Policy': 'unsafe-none' },
    },
    preview: {
      headers: { 'Cross-Origin-Opener-Policy': 'unsafe-none' },
    },
  }
})