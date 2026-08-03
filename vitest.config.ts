import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    // Las pruebas de punta a punta las corre Playwright, no Vitest.
    exclude: ["e2e/**", "node_modules/**", ".next/**", ".open-next/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/**",
        ".next/**",
        ".open-next/**",
        "e2e/**",
        "scripts/**",
        "**/*.config.*",
        "**/*.d.ts",
      ],
    },
  },
});
