import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    sequence: {
      concurrent: false,
    },
    hookTimeout: 60_000,
    testTimeout: 30_000,
  },
});
