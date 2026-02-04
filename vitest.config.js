import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    alias: {
      '$lib': path.resolve('./src/lib'),
      '$app': path.resolve('./src/app-mocks')
    },
    // Ensure Svelte uses browser build in tests
    conditions: ['browser']
  },
  test: {
    // Test file patterns - support both JS and TS
    include: ['tests/**/*.test.{js,ts}'],

    // Use jsdom for all tests (stores and components need DOM)
    environment: 'jsdom',

    // Setup files for component tests
    setupFiles: ['tests/components/setup.ts'],

    // Show verbose output
    reporters: ['verbose'],

    // Global test timeout
    testTimeout: 10000,

    // Enable globals for testing-library
    globals: true,
  },
});
