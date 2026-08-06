import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import security from "eslint-plugin-security";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /**
   * REVISIÓN DE SEGURIDAD, EN MODO AVISO (blindaje del 6 ago 2026).
   *
   * `eslint-plugin-security` caza patrones peligrosos: `eval`, expresiones
   * regulares que se pueden hacer explotar, rutas de archivo armadas con
   * texto de fuera, objetos indexados con una variable del usuario.
   *
   * Va como AVISO y no como error a propósito. El proyecto tiene meses de
   * código escrito; encenderlo en rojo rompería el build por cosas que llevan
   * funcionando desde el principio, y la regla del blindaje es que lo viejo se
   * anota como deuda, no se "arregla" a lo bruto para que pase el semáforo.
   *
   * Lo que sí hace desde hoy: cualquier patrón peligroso NUEVO sale en la
   * consola en cuanto se escribe.
   */
  {
    plugins: { security },
    rules: {
      "security/detect-eval-with-expression": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-unsafe-regex": "warn",
      "security/detect-buffer-noassert": "warn",
      "security/detect-child-process": "warn",
      "security/detect-disable-mustache-escape": "warn",
      "security/detect-no-csrf-before-method-override": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-pseudoRandomBytes": "warn",
    },
  },

  /**
   * LAS PRUEBAS Y LOS SCRIPTS LEEN ARCHIVOS DEL PROPIO REPOSITORIO.
   *
   * Varias pruebas recorren carpetas para comprobar reglas del proyecto —que
   * no haya un `type="password"` suelto, que ningún JSON-LD se escriba sin
   * escapar—, y para eso construyen rutas. El aviso de "nombre de archivo no
   * literal" existe para cuando la ruta viene de fuera; aquí viene de
   * `import.meta.dirname`. Son 21 avisos de ruido puro que taparían uno de
   * verdad el día que aparezca.
   *
   * En el código del producto la regla sigue encendida.
   */
  {
    files: ["tests/**", "e2e/**", "scripts/**"],
    rules: { "security/detect-non-literal-fs-filename": "off" },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archivos generados: no se revisan a mano.
    ".open-next/**",
    ".dist-worker/**",
    ".wrangler/**",
    "out-deploy/**",
    "coverage/**",
    "cloudflare-env.d.ts",
    "public/sw.js",
  ]),

  /**
   * VA AL FINAL, SIEMPRE. Apaga las reglas de estilo que chocan con Prettier
   * para que el formato no genere ruido en la revisión. Si se pone antes de
   * otra configuración, esa vuelve a encenderlas.
   */
  prettier,
]);

export default eslintConfig;
