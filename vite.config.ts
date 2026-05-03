import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
const basePath = process.env.VITE_BASE_PATH ?? '/room-planner/'

export default defineConfig({
  base: basePath,
  plugins: [react(), tailwindcss()],
})
