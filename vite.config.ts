import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: { demo: 'index.html', counter: 'readme-counter.html', introduction: 'readme-weather.html' } } },
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { exclude: ['@owebeeone/grip-react'] }
})
