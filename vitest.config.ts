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

      /**
       * EL SUELO DE LA COBERTURA. De aquí solo se sube.
       *
       * Estos números son EXACTAMENTE los que tenía el proyecto el 6 ago 2026,
       * el día que se instaló el blindaje. No son una meta inventada: son la
       * foto de lo que ya estaba probado. Si un cambio deja menos código
       * cubierto que hoy, la compilación se pone roja.
       *
       * **PROHIBIDO bajarlos para que pase un cambio.** Si esto se pone rojo,
       * lo que falta es la prueba del código nuevo, no el umbral. Subirlos
       * cuando la cobertura suba de verdad sí es correcto y bienvenido.
       *
       * OJO CON LO QUE MIDE: se cuentan los archivos que las pruebas tocan, no
       * el proyecto entero. Un archivo nuevo sin ninguna prueba no baja este
       * número, porque ni se mide. Medir todo dejaría el suelo en la décima
       * parte y no serviría de nada. Está anotado como deuda.
       */
      thresholds: {
        // Subido el 6 ago 2026 al entregar los formularios sólidos: la
        // cobertura pasó de 85.86 a 90.78. El suelo sube con ella.
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 92,
      },
    },
  },
});
