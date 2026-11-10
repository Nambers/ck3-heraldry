import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "./",
  // one page (index.html); the pages of the site are views, see src/routes.ts
  test: { globals: true },
});
