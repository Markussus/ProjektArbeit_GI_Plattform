import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const useManagedPreview = process.env.PLAYWRIGHT_MANAGED_PREVIEW === "1";
const chromiumExecutablePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: "html",
  webServer: useManagedPreview
    ? undefined
    : {
        command: "npm run preview:ci",
        url: baseUrl,
        reuseExistingServer: !isCI,
        timeout: 120 * 1000,
      },
  use: {
    baseURL: baseUrl,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : undefined,
      },
    },
  ],
});
