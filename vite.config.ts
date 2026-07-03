/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base '/skat/' -> deployed at https://<user>.github.io/skat/
// Routing uses HashRouter, so the base only affects asset URLs.
export default defineConfig({
  base: '/skat/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
  },
})
