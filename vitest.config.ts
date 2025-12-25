import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts'],
    exclude: ['build/**', 'node_modules/**'],
    env: {
      GEMINI_API_KEY: 'test-api-key',
      DISCORD_TOKEN: 'test-discord-token',
      VOICEVOX_API_URL: 'http://localhost:50021',
    },
  },
});