import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  LARGO_MAXIMO_ALT,
  LARGO_MAXIMO_BASE,
  limpiarTextoAlt,
  nombreDeFoto,
} from "@/lib/imagenes/nombre-de-foto";

/**
 * LAS FOTOS NUEVAS SE LLAMAN COMO EL PRODUCTO (6 sep 2026).
 *
 * Google: «usa nombres de archivo cortos pero descriptivos» y, antes que
 * eso, un texto alternativo que describa la foto. El dueño bajó las cuatro
 * fotos del POS y eran `ySbdthKtli-jhl41CplHh.webp`. Lo ya subido no se
 * toca; lo nuevo sale bien desde el formulario y desde el copiador de CJ.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf8");

describe("el nombre de una foto nueva", () => {
  it("es el slug del producto, el número de la foto y un sufijo corto, con guiones", () => {
    expect(
      nombreDeFoto({
        slug: "punto-de-venta-pos-2",
        numero: 1,
        sufijo: "X8k2Q1",
      }),
    ).toBe("punto-de-venta-pos-2-1-x8k2q1");
  });

  it("limpia acentos, espacios y signos: solo letras, números y guiones", () => {
    expect(
      nombreDeFoto({
        slug: "Máquina POS/ 2026 · doble pantalla",
        numero: 2,
        sufijo: "ab12cd",
      }),
    ).toBe("maquina-pos-2026-doble-pantalla-2-ab12cd");
  });

  it("se acorta a 60 sin partir una palabra ni terminar en guion", () => {
    const largo = Array.from({ length: 20 }, (_, i) => `palabra${i}`).join("-");
    const nombre = nombreDeFoto({ slug: largo, numero: 1, sufijo: "abc123" });
    const base = nombre.replace(/-1-abc123$/, "");
    expect(base.length).toBeLessThanOrEqual(LARGO_MAXIMO_BASE);
    expect(base.endsWith("-")).toBe(false);
    expect(largo.startsWith(base)).toBe(true);
    expect(nombre.endsWith("-1-abc123")).toBe(true);
  });

  it("sin slug dice «producto», el número nunca baja de 1 y el sufijo va en minúsculas", () => {
    expect(nombreDeFoto({ slug: null, numero: 3, sufijo: "QqQ" })).toBe(
      "producto-3-qqq",
    );
    expect(nombreDeFoto({ slug: "x", numero: 0, sufijo: "a" })).toBe("x-1-a");
    expect(nombreDeFoto({ slug: "x", numero: Number.NaN, sufijo: "-" })).toBe(
      "x-1-0",
    );
  });
});

describe("el texto alternativo que escribe el comercio", () => {
  it("se limpia, se acota y vacío es nulo (la galería cae al título)", () => {
    expect(limpiarTextoAlt("  POS   con  pantalla ")).toBe("POS con pantalla");
    expect(limpiarTextoAlt("")).toBeNull();
    expect(limpiarTextoAlt(null)).toBeNull();
    expect(limpiarTextoAlt(new File([], "x"))).toBeNull();
    const largo = "a".repeat(LARGO_MAXIMO_ALT + 40);
    expect(limpiarTextoAlt(largo)?.length).toBe(LARGO_MAXIMO_ALT);
  });
});

describe("candados: lo nuevo sale con nombre, lo viejo no se toca", () => {
  const subidas = leer("src/lib/subidas.ts");
  const acciones = leer("src/lib/productos/acciones.ts");
  const copiador = leer("src/lib/catalogo/copiar-foto.ts");
  const formulario = leer("src/components/panel/formulario-producto.tsx");

  it("subirImagen acepta el nombre y sin él sigue al azar", () => {
    expect(subidas).toContain("opciones: { nombre?: string } = {}");
    expect(subidas).toContain("${nombre || nanoid()}");
  });

  it("los documentos (comprobantes, facturas) NO llevan nombre descriptivo: siguen al azar", () => {
    const documentos = subidas.slice(
      subidas.indexOf("export async function subirDocumento"),
    );
    expect(documentos).toContain("${nanoid()}.${extension}");
    expect(documentos).not.toContain("nombre");
  });

  it("guardarProducto nombra cada foto con el slug del producto y guarda lo que se ve", () => {
    const desde = acciones.indexOf("export async function guardarProducto");
    const hasta = acciones.indexOf("export async function borrarFoto");
    const cuerpo = acciones.slice(desde, hasta);
    expect(cuerpo).toContain("slug: slugProducto,");
    expect(cuerpo).toMatch(/nombre: nombreDeFoto\(\{\s*slug: slugProducto,/);
    expect(cuerpo).toContain(
      "textoAltEs: limpiarTextoAlt(formulario.get(`alt_es_nueva_${i}`))",
    );
    expect(cuerpo).toContain("/^alt_(es|en)_([A-Za-z0-9_-]+)$/");
    /* Solo fotos de ESTE producto: el id del campo no se cree sin comprobar. */
    expect(cuerpo).toContain("eq(imagenesProducto.productoId, productoId)");
  });

  it("el copiador de CJ usa el mismo nombre, y los dos que lo llaman le pasan el slug", () => {
    expect(copiador).toContain("nombreDeFoto({");
    expect(copiador).toContain("foto.slug");
    for (const ruta of [
      "src/lib/catalogo/fotos-automaticas.ts",
      "src/lib/catalogo/traer-fotos.ts",
    ]) {
      const fuente = leer(ruta);
      expect(fuente, ruta).toContain("slug: productos.slug");
      expect(fuente, ruta).toContain("slug: foto.slug,");
    }
  });

  it("el formulario pide qué se ve en cada foto, en los dos idiomas, también en las nuevas", () => {
    expect(formulario).toContain("name={`alt_es_${f.id}`}");
    expect(formulario).toContain("name={`alt_en_${f.id}`}");
    expect(formulario).toContain("name={`alt_es_nueva_${i}`}");
    expect(formulario).toContain("maxLength={125}");
    expect(leer("src/lib/productos/consultas.ts")).toContain(
      "altEs: f.textoAltEs ?? null,",
    );
  });

  it("los textos existen en los dos idiomas", () => {
    for (const idioma of ["es", "en"]) {
      const m = JSON.parse(leer(`messages/${idioma}.json`)) as {
        panel: { producto: { fotos: Record<string, unknown> } };
      };
      for (const clave of [
        "descripcionEs",
        "descripcionEn",
        "descripcionAyuda",
      ]) {
        expect(typeof m.panel.producto.fotos[clave], `${idioma}.${clave}`).toBe(
          "string",
        );
      }
    }
  });
});
