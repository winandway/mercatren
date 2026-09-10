import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { BODEGA_MIAMI, lineasDeEtiqueta, TAPADO } from "@/lib/casillero/bodega";

const leer = (r: string) => readFileSync(r, "utf8");

/**
 * ══ LA DIRECCIÓN DE LA BODEGA NO SE PUBLICA. NUNCA ══
 *
 * Dictado por Richard el 9 sep 2026, y es la regla que sostiene el sistema:
 * _«si la gente no crea la cuenta y pone la dirección directamente y nos
 * manda algo, no sabemos de quién es»_. La dirección **sin el código no
 * sirve**: una caja con la calle correcta y sin código es un huérfano, y
 * averiguar de quién es cuesta más que la caja.
 *
 * En público se dice «nuestra bodega en Miami» y nada más.
 */
describe("la dirección es privada", () => {
  it("tapada, no sale ni la calle ni un código de ejemplo", () => {
    const lineas = lineasDeEtiqueta("Tu nombre", "BW-100008", "es", "tapada");
    const todo = lineas.map((l) => l.valor).join(" | ");
    expect(todo).not.toContain(BODEGA_MIAMI.linea1);
    expect(todo).not.toContain("BW-100008");
    expect(todo).toContain(TAPADO);
    /* Y cada línea tapada viene marcada, para que la pantalla no le ponga
       un botón de copiar a un dato que no existe. */
    const conDato = lineas.filter((l) => l.tapado);
    expect(conDato.length).toBeGreaterThanOrEqual(3);
  });

  it("completa, sí trae la calle y el código: es lo que se pega en la tienda", () => {
    const lineas = lineasDeEtiqueta("Juan Perez", "BW-100008", "es");
    const todo = lineas.map((l) => l.valor).join(" | ");
    expect(todo).toContain(BODEGA_MIAMI.linea1);
    /* El código va DOS veces: pegado al nombre y en la línea 2, porque
       Amazon normaliza contra USPS y a veces borra la línea 2. */
    expect(todo.match(/BW-100008/g)).toHaveLength(2);
    expect(lineas.some((l) => l.tapado)).toBe(false);
  });

  it("LA PÁGINA PÚBLICA PIDE LA VERSIÓN TAPADA, y no dibuja la calle", () => {
    const pagina = leer("src/app/[locale]/(tienda)/casillero/page.tsx");
    expect(pagina).toContain('"tapada"');
    /* La calle no se nombra ni por la constante: en esta página no va. */
    expect(pagina).not.toContain("BODEGA_MIAMI.linea1");
    expect(pagina).not.toContain("enlaceDeMapa");
    /* La ciudad sí: saber que la bodega está en Miami no lleva a ninguna
       puerta, y es lo que le dice al comprador que el servicio existe. */
    expect(pagina).toContain("BODEGA_MIAMI.ciudad");
  });

  it("la calle no aparece escrita a mano en ninguna pantalla", () => {
    /* Una dirección repetida en cinco sitios es un paquete perdido el día
       que la bodega cambie de local. Solo existe en `bodega.ts`. */
    for (const ruta of [
      "src/app/[locale]/(tienda)/casillero/page.tsx",
      "src/components/casillero/copiar-linea.tsx",
      "src/components/casillero/formulario-casillero.tsx",
    ]) {
      expect(leer(ruta), ruta).not.toContain("14329");
    }
  });
});
