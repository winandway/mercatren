import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { ESPACIOS_QUE_NO_VIAJAN } from "@/i18n/espacios";

/**
 * EL PAQUETE DE TEXTOS QUE VIAJA AL NAVEGADOR ESTÁ RECORTADO.
 *
 * El layout público NO manda los espacios de `ESPACIOS_QUE_NO_VIAJAN`
 * (panel, correos): son la mitad del paquete y un visitante del catálogo no
 * los usa nunca. El layout del panel re-provee los mensajes completos para
 * sus pantallas.
 *
 * Esta prueba vigila el trato: si mañana un componente de navegador FUERA
 * del panel usa `useTranslations("panel...")`, en producción saldrían las
 * claves crudas en pantalla ("panel.titulo") sin que nadie lo note en local.
 * Mejor que truene aquí.
 */

const RAIZ = join(import.meta.dirname, "..", "..", "src");

function archivosDeCodigo(carpeta: string): string[] {
  return readdirSync(carpeta).flatMap((nombre) => {
    const ruta = join(carpeta, nombre);
    if (statSync(ruta).isDirectory()) return archivosDeCodigo(ruta);
    return /\.tsx?$/.test(nombre) ? [ruta] : [];
  });
}

/** Un archivo del panel: vive bajo app/[locale]/panel o components/panel. */
function esDelPanel(ruta: string): boolean {
  return ruta.split(sep).includes("panel");
}

describe("los espacios que no viajan al navegador", () => {
  const clientes = archivosDeCodigo(RAIZ).filter((ruta) =>
    /^\s*["']use client["']/.test(readFileSync(ruta, "utf8")),
  );

  it("hay componentes de navegador que revisar", () => {
    expect(clientes.length).toBeGreaterThan(10);
  });

  it("ningún componente de navegador fuera del panel los usa", () => {
    const fuera: string[] = [];

    for (const ruta of clientes) {
      const codigo = readFileSync(ruta, "utf8");
      for (const uso of codigo.matchAll(/useTranslations\("([^"]+)"\)/g)) {
        const espacio = uso[1].split(".")[0];
        const vetado = (ESPACIOS_QUE_NO_VIAJAN as readonly string[]).includes(
          espacio,
        );
        // `panel` se permite SOLO dentro del panel, donde su layout
        // re-provee los mensajes completos. `correos` no se permite en
        // ningún componente de navegador: es del servidor.
        if (vetado && !(espacio === "panel" && esDelPanel(ruta))) {
          fuera.push(`${ruta} usa "${uso[1]}"`);
        }
      }
    }

    expect(fuera, fuera.join("\n")).toEqual([]);
  });
});
