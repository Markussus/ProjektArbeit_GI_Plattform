import { defineConfig } from "@playwright/test";

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
    browserName: "chromium",
    ...(isCI
      ? {
          channel: "chromium",
          executablePath: "/usr/bin/chromium",
          launchOptions: {
            args: ["--no-sandbox"],
          },
        }
      : {}),
  },
  projects: [
    {
      name: "chromium",
    },
  ],
});
