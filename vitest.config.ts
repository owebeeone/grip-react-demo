import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { dedupe: ['react', 'react-dom', '@owebeeone/grip-react', '@owebeeone/grip-core'] },
  test: { environment: 'jsdom', include: ['tests/**/*.test.tsx'] },
});
