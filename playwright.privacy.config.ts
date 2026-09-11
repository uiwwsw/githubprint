import { defineConfig } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./tests/privacy-browser",
  outputDir: ".cache/privacy-browser-tests",
  timeout: 60_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3111",
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run start -- --port 3111",
    url: "http://localhost:3111/en",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      NODE_OPTIONS: `--require ${JSON.stringify(path.resolve("tests/helpers/github-fixture.cjs"))}`,
      GITHUBPRINT_PRIVACY_TEST_SERVER: "1",
      GITHUBPRINT_DISABLE_THROTTLE: "1",
    },
  },
});
