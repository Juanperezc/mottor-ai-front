/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // The back's CORS allows exactly FRONTEND_URL, so never fall back to another port silently.
  server: { port: Number(loadEnv(mode, process.cwd(), '').DEV_PORT) || 5173, strictPort: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    env: { VITE_API_URL: 'http://api.test' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/api/schema.d.ts',
        'src/main.tsx',
        'src/mocks/browser.ts',
        'src/test/**',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
}));
