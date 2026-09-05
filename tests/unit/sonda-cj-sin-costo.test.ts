import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { FRESCURA_MS, leerUltimaLlamada } from "@/lib/cj/puntos";
import {
  PUNTOS_POR_PRODUCTO,
  productosPorDia,
} from "@/lib/cj/reparto-de-puntos";

/**
 * PREGUNTARLE A CJ SI ESTÁ VIVO COSTABA 50 PUNTOS (5 sep 2026).
 *
 * `saludDelProveedor()` usaba `/product/list` —**50 puntos**, dos productos y
 * medio afinados— y la llamaban el vigilante cada 20 minutos Y **cada visita
 * a `/datos/salud`, que es una página pública**. Midiendo el catálogo yo mismo
 * la consulté sesenta veces en un día: tres mil puntos del dueño gastados en
 * preguntar en vez de publicar.
 *
 * El sistema le habla a CJ todo el día; ahora se anota cómo fue esa llamada y
 * la sonda LEE el apunte. Cero puntos, y más honesto: dice cómo le fue a una
 * llamada del trabajo real.
 */
describe("la sonda de CJ", () => {
  const piezas = readFileSync("src/lib/salud/piezas.ts", "utf8");
  const cliente = readFileSync("src/lib/cj/cliente.ts", "utf8");

  it("NO le pide nada a CJ: lee lo anotado", () => {
    const sonda = piezas.slice(
      piezas.indexOf("export async function saludDelProveedor"),
      piezas.indexOf("¿Está armado el aviso de Stripe?"),
    );
    /* `/product/list` cuesta 50 puntos según la tabla de CJ. Ninguna llamada
       puede vivir dentro de una sonda que consulta cualquiera. */
    expect(sonda).not.toContain("/product/list");
    expect(sonda).not.toContain("llamarCj");
    expect(sonda).toContain("leerUltimaLlamada");
  });

  it("cada llamada real de CJ deja su apunte", () => {
    expect(cliente).toContain("anotarComoFue(true)");
    expect(cliente).toContain("anotarComoFue(false)");
  });

  it("un apunte viejo NO se hace pasar por «ok»", () => {
    /* Decir «ok» con un dato de hace horas es peor que decir «sin datos»:
       manda a no mirar justo cuando CJ se acaba de caer. */
    const ahora = 1_000_000_000;
    const viejo = JSON.stringify({ ok: true, enMs: ahora - FRESCURA_MS - 1 });
    expect(leerUltimaLlamada(viejo, ahora)).toBeNull();
    const fresco = JSON.stringify({ ok: true, enMs: ahora - 60_000 });
    expect(leerUltimaLlamada(fresco, ahora)).toEqual({
      ok: true,
      enMs: ahora - 60_000,
    });
    expect(leerUltimaLlamada(null, ahora)).toBeNull();
    expect(leerUltimaLlamada("no es json", ahora)).toBeNull();
  });

  it("el panel promete el ritmo de CJ, no el de nuestro reloj", () => {
    /* Decía 40 × 96 vueltas = 3.840 al día. Eso es lo que aguanta nuestro
       reloj; el techo lo pone CJ. Con la base y sin comprar nada son 2.500. */
    expect(productosPorDia(0)).toBe(50_000 / PUNTOS_POR_PRODUCTO);
    /* Cada dólar comprado son 100 puntos = 5 productos más al día. */
    expect(productosPorDia(500) - productosPorDia(0)).toBe(2_500);
    const panel = readFileSync(
      "src/components/panel/cj/importar-masivo.tsx",
      "utf8",
    );
    expect(panel).toContain("productosPorDia()");
    expect(panel).not.toContain("AFINADOS_POR_VUELTA * VUELTAS_POR_DIA");
  });
});
