import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: ".cache/browser-tests",
  timeout: 60_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.DOCUMENT_TEST_URL ?? "http://localhost:3107",
    locale: "ko-KR",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run dev -- --port 3107",
    url: "http://localhost:3107/en",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { GITFOLIO_USE_FIXTURE: "1" },
  },
});
