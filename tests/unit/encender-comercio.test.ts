import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ EL INTERRUPTOR DE UN COMERCIO (21 sep 2026) ══
 *
 * Richard fue al panel a activar un seller de Venezuela y no había con qué:
 * existía «Aprobar», que sirve una sola vez y solo si la tienda está
 * `pendiente`. Una tienda en `borrador` o suspendida no se podía encender sin
 * tocar la base a mano. Esta prueba se pone roja si el interruptor
 * desaparece, si deja de pedir el rol, o si deja de respetar el país.
 */
const leer = (relativo: string) =>
  readFileSync(join(process.cwd(), relativo), "utf8");
const sinComentarios = (codigo: string) =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const acciones = sinComentarios(leer("src/lib/tiendas/acciones.ts"));
const cuerpo = acciones.slice(
  acciones.indexOf("export async function cambiarEstadoDeComercio("),
  acciones.indexOf("export async function aprobarComercio("),
);

describe("se puede encender y apagar un comercio", () => {
  it("la acción existe y hace las dos cosas", () => {
    expect(cuerpo.length).toBeGreaterThan(100);
    expect(cuerpo).toContain('encendida ? "activa" : "suspendida"');
  });

  it("solo Soporte, y solo en el país que está mirando", () => {
    /* Sin esto, desde el panel de Venezuela se apagaría una tienda de
       Estados Unidos, y un validador podría sacar comercios del catálogo. */
    expect(cuerpo).toContain("await esSoporteDeVerdad()");
    expect(cuerpo).toContain("await mercadoDelPanel()");
    expect(cuerpo).toContain("eq(tiendas.mercado, mercado.codigo)");
  });

  it("apagar solo lo esconde: no le quita la entrada ni el dinero", () => {
    /* La decisión (21 sep 2026): el dueño sigue entrando a su panel y
       pidiendo su dinero. Lo único que cambia es el estado de la tienda. */
    expect(cuerpo).not.toMatch(/user|sesion|session|retiro|saldo|billetera/i);
  });

  it("el catálogo se entera del cambio", () => {
    for (const ruta of ["tienda/[slug]", "(tienda)/tiendas", "catalogo"]) {
      expect(cuerpo, ruta).toContain(ruta);
    }
  });

  it("el botón está en Comercios, y apagar pide confirmación", () => {
    const pagina = leer("src/app/[locale]/panel/tiendas/page.tsx");
    expect(pagina).toContain("<EncenderComercio");
    expect(pagina).toContain('encendida={c.estado === "activa"}');
    const boton = sinComentarios(
      leer("src/components/panel/tiendas/encender-comercio.tsx"),
    );
    /* Encender no pregunta; apagar sí. */
    expect(boton).toContain("encendida ? setConfirmando(true) : cambiar(true)");
    expect(boton).toContain("confirmarApagar");
  });
});
