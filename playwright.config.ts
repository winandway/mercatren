import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3000;
const BASE_URL = `http://localhost:${PUERTO}`;

/**
 * Pruebas de punta a punta: abren el sitio de verdad en un navegador.
 * Aqui van los flujos que no se pueden romper: buscar, comprar, pagar.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,

  /**
   * DOS PROCESOS COMO MAXIMO, y no los que quiera la maquina.
   *
   * Estas pruebas corren contra el servidor de desarrollo, que compila cada
   * ruta la primera vez que alguien la pide. Con nueve procesos pidiendo
   * paginas distintas a la vez, la compilacion no da abasto y las pruebas
   * fallan por lentitud, no porque el sitio este mal. Costo caro descubrirlo.
   */
  workers: 2,
  reporter: process.env.CI ? "github" : "list",

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "escritorio",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "celular",
      use: { ...devices["iPhone 15"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    // Se comprueba /es y no /, porque / siempre redirige al idioma y Playwright
    // no lo toma como senal de que el servidor ya esta listo.
    url: `${BASE_URL}/es`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
