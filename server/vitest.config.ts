import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

loadEnv({
  path: ".env.test",
  override: true,
});

export default defineConfig({
  test: {
    environment: "node",

    globals: false,

    fileParallelism: false,

    sequence: {
      concurrent: false,
    },

    testTimeout: 10_000,

    hookTimeout: 10_000,
  },
});
