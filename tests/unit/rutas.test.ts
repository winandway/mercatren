import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  RUTA_ASISTENTE,
  RUTA_AUTH,
  RUTA_MEDIA,
  RUTA_STRIPE_WEBHOOK,
  RUTA_UPLOAD,
} from "@/lib/rutas";

/**
 * LAS RUTAS DEL SERVIDOR TIENEN QUE EXISTIR DE VERDAD.
 *
 * ══ POR QUE ESTA PRUEBA (13 ago 2026) ══
 *
 * `RUTA_STRIPE_WEBHOOK` decia `/datos/stripe/aviso` y esa direccion nunca
 * existio: el archivo esta en `src/app/datos/stripe/route.ts`. Ningun codigo
 * usaba la constante, asi que nada se rompia y nadie se enteraba — pero es
 * justo la constante que uno lee para ir a pegar la direccion en el panel de
 * Stripe.
 *
 * El dia que se hubiera configurado asi, Stripe habria llamado a un 404: da el
 * aviso por fallido, lo reintenta unas horas y despues se rinde. El comprador
 * paga, el dinero entra en la cuenta, y su pedido se queda en "esperando el
 * pago" sin que nadie lo vea. Es un fallo que no da error en ninguna pantalla.
 *
 * ══ COMO SE COMPRUEBA ══
 *
 * Una ruta del App Router es una carpeta con su `route.ts` dentro. Se mira que
 * el archivo este en el disco: es lo unico que demuestra que la direccion
 * responde. Una prueba que solo comparase textos entre si no habria atrapado
 * nada, porque los dos textos estaban en el mismo sitio equivocado.
 */

const APP = join(import.meta.dirname, "..", "..", "src", "app");

/** Las rutas fijas, con el archivo que las atiende. */
const FIJAS: Array<{ nombre: string; ruta: string }> = [
  { nombre: "RUTA_STRIPE_WEBHOOK", ruta: RUTA_STRIPE_WEBHOOK },
  { nombre: "RUTA_ASISTENTE", ruta: RUTA_ASISTENTE },
];

/** Las que terminan en un tramo variable: se comprueba la carpeta padre. */
const CON_COMODIN: Array<{ nombre: string; ruta: string; hoja: string }> = [
  { nombre: "RUTA_AUTH", ruta: RUTA_AUTH, hoja: "[...all]" },
  { nombre: "RUTA_MEDIA", ruta: RUTA_MEDIA, hoja: "[...clave]" },
];

describe("las rutas del servidor", () => {
  it.each(FIJAS)("$nombre ($ruta) tiene su route.ts", ({ ruta }) => {
    expect(existsSync(join(APP, ruta, "route.ts"))).toBe(true);
  });

  it.each(CON_COMODIN)(
    "$nombre ($ruta) tiene su route.ts",
    ({ ruta, hoja }) => {
      expect(existsSync(join(APP, ruta, hoja, "route.ts"))).toBe(true);
    },
  );

  /**
   * NINGUNA PUEDE EMPEZAR POR `/api`.
   *
   * En YaDominios Cloud ese prefijo lo capturan los archivos estaticos antes
   * de que corra el codigo, asi que una ruta ahi no responde nunca. Es la
   * primera regla del proyecto y la que mas facil se olvida al agregar una.
   */
  it("ninguna empieza por /api", () => {
    for (const ruta of [
      RUTA_AUTH,
      RUTA_STRIPE_WEBHOOK,
      RUTA_MEDIA,
      RUTA_UPLOAD,
      RUTA_ASISTENTE,
    ]) {
      expect(ruta.startsWith("/api")).toBe(false);
      expect(ruta.startsWith("/")).toBe(true);
      /* Sin barra al final: pegada en el panel de un tercero daria `//`. */
      expect(ruta.endsWith("/")).toBe(false);
    }
  });
});
