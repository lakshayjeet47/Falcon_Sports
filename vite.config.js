import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT for GitHub Pages: base must match your repo name exactly.
// e.g. if your repo is github.com/you/falcon-sports, base should be '/falcon-sports/'
export default defineConfig({
  plugins: [react()],
  base: '/Falcon_Sports/',
})
