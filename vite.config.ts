import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(),tailwindcss()],
  server: {
    host: '0.0.0.0',
    https: true, // Enable HTTPS for WebXR compatibility
  }
})
