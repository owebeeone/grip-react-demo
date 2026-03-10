import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@owebeeone/glial-local': path.resolve(__dirname, '../glial-local-ts/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: { exclude: ['@owebeeone/grip-react', '@owebeeone/glial-local'] }
})
