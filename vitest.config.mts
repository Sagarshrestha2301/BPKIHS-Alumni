import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 reads `compilerOptions.paths` itself; the `vite-tsconfig-paths` plugin is no
  // longer needed, so the test and production resolution rules are the same code.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
