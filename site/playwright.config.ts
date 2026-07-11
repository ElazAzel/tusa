import { defineConfig } from "@playwright/test";
import { E2E_ADMIN_PASSWORD, E2E_ADMIN_SESSION_SECRET } from "./tests/e2e/test-auth";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/demo",
    reuseExistingServer: true,
    timeout: 120_000,
    env: {
      ...process.env,
      ADMIN_PASSWORD: E2E_ADMIN_PASSWORD,
      ADMIN_SESSION_SECRET: E2E_ADMIN_SESSION_SECRET,
    },
  },
});
