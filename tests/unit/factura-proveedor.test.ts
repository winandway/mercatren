import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { MEDIA_PRIVADOS } from "@/lib/media/privados";

/**
 * LA FACTURA DE QUIEN NOS VENDE LA MERCANCÍA DE ESTADOS UNIDOS.
 *
 * En una venta de allá vende Mercatren LLC, así que NO hay orden de compra a
 * ningún comercio: nadie se factura a sí mismo. El único papel que respalda
 * ese costo es la factura del proveedor.
 *
 * La tabla existía desde el 21 de agosto y **nadie escribía en ella**: el
 * plan la daba por hecha con la casilla marcada. Estas pruebas son para que no
 * vuelva a quedarse en una tabla vacía.
 */
describe("la factura del proveedor se archiva de verdad", () => {
  const acciones = readFileSync("src/lib/cj/proveedor-acciones.ts", "utf8");

  it("hay una acción que la guarda", () => {
    expect(
      acciones,
      "la tabla facturas_proveedor volvió a quedarse sin nadie que escriba en ella",
    ).toContain("archivarFacturaDelProveedor");
    expect(acciones).toContain("insert(facturasProveedor)");
  });

  it("y la pantalla la ofrece", () => {
    const ui = readFileSync(
      "src/components/panel/pedidos-proveedor.tsx",
      "utf8",
    );
    expect(
      ui,
      "sin botón en pantalla, la acción existe y nadie la puede usar",
    ).toContain("archivarFacturaDelProveedor");
  });

  it("solo el equipo interno puede archivarla", () => {
    const trozo = acciones.slice(
      acciones.indexOf("export async function archivarFacturaDelProveedor"),
    );
    expect(trozo.slice(0, 500)).toContain("exigirEquipoInterno");
  });

  it("no se pisa una factura ya archivada", () => {
    /* Reemplazarla en silencio dejaría el bucket con un archivo huérfano y el
       asiento respaldado por otro documento sin que nadie se entere. */
    const trozo = acciones.slice(
      acciones.indexOf("export async function archivarFacturaDelProveedor"),
    );
    expect(trozo).toContain("ya tiene su factura archivada");
  });
});

describe("EL COSTO REAL NO SE PUBLICA", () => {
  it("las facturas del proveedor son privadas", () => {
    /* Lleva el precio al que compramos. Es el número del que sale el margen:
       si esa carpeta fuera pública, cualquiera lo calcularía restando. */
    expect(
      MEDIA_PRIVADOS,
      "la carpeta de facturas del proveedor dejó de ser privada",
    ).toContain("facturas-proveedor/");
  });

  it("y ni siquiera un comercio con sesión las abre", () => {
    const media = readFileSync("src/app/media/[...clave]/route.ts", "utf8");
    expect(media).toContain('ruta.startsWith("facturas-proveedor/")');
  });
});
