import { defineConfig } from 'vitest/config';

// Tests de la base : Postgres local (TEST_PG_URL) ou `supabase start` (port 54322).
export default defineConfig({
  test: { include: ['supabase/tests/db/**/*.test.ts'], environment: 'node', testTimeout: 30_000, hookTimeout: 60_000, fileParallelism: false },
});
