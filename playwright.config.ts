import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests. They run against a running app, either in demo mode (no
 * Supabase env vars) or connected to a seeded Supabase project (local
 * `supabase start` + `supabase db reset`) with email confirmations disabled,
 * so sign-up signs the user in.
 *
 *   npm run build && npm run start   # in one terminal
 *   npm run test:e2e                 # in another
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  timeout: 90_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    contextOptions: { reducedMotion: "reduce" },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
