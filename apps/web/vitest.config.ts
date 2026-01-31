import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/e2e/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/*.stories.*',
        '**/.next/**',
        '**/coverage/**',
        '**/__tests__/**',
      ],
      thresholds: {
        // General thresholds
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        // Critical path thresholds (higher requirements)
        '**/components/auth/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        '**/components/billing/**': {
          lines: 90,
          functions: 90,
          branches: 85,
          statements: 90,
        },
        '**/lib/security/**': {
          lines: 95,
          functions: 95,
          branches: 90,
          statements: 95,
        },
        '**/lib/api/**': {
          lines: 85,
          functions: 85,
          branches: 80,
          statements: 85,
        },
      },
      reportsDirectory: './coverage',
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
