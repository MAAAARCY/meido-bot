import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['build/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'build/**',
        'test/**',
        '**/*.test.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 66,
        statements: 80,
      },
    },
    env: {
      GEMINI_API_KEY: 'test-api-key',
      DISCORD_TOKEN: 'test-discord-token',
      VOICEVOX_API_URL: 'http://localhost:50021',
    },
  },
});