import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: "./vitest.global-setup.ts",
    // db-backed test files share data/test.db — run files serially
    fileParallelism: false,
    // keep test uploads away from the real data/uploads directory
    env: { SHEETUP_UPLOADS_DIR: "data/test-uploads" },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
