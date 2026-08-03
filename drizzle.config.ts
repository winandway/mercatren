import { defineConfig } from "drizzle-kit";

/**
 * Genera el SQL de las migraciones a partir de src/lib/db/schema.ts.
 *
 * Importante: aqui NO hay credenciales a proposito. Este archivo solo escribe
 * archivos .sql en drizzle/migrations. Aplicar esas migraciones contra la base
 * real es un paso aparte y requiere autorizacion expresa.
 */
export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  casing: "snake_case",
  verbose: true,
  strict: true,
});
