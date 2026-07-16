import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  outputDir: ".playwright-results",
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100", trace: "off", serviceWorkers: "block" },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: "npm run start -- -p 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 60_000 },
});
