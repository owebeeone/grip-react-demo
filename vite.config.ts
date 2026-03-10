import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/demo/',
  plugins: [react()],
  resolve: {
    alias: {
      '@owebeeone/grip-react': path.resolve(__dirname, '../grip-react/dist/index.mjs'),
      '@owebeeone/grip-core': path.resolve(__dirname, '../grip-core/dist/index.mjs'),
      '@owebeeone/glial-local': path.resolve(__dirname, '../glial-local-ts/src/index.ts'),
      '@owebeeone/glial-net': path.resolve(__dirname, '../glial-net-ts/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['@owebeeone/grip-react', '@owebeeone/grip-core', '@owebeeone/glial-local', '@owebeeone/glial-net'],
  },
})
