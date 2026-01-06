import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/**/*.test.js'],

    // Use Node environment (no DOM needed for grading logic)
    environment: 'node',

    // Show verbose output
    reporters: ['verbose'],

    // Fail fast on first error (optional, remove if you want all results)
    // bail: 1,
  },
});
