import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  aCentavos,
  camposDelProducto,
  confirmoElBorrado,
  faltaEnProducto,
  palabraDeConfirmacion,
  precioPublicadoCentavos,
  type DatosProducto,
} from "../../app-movil/src/lib/productos";
import {
  confirmoElBorrado as confirmoElBorradoDelSitio,
  PALABRA_DE_CONFIRMACION,
} from "@/lib/cuenta/borrar-puro";
import { precioConAjusteCentavos } from "@/lib/dinero";

/**
 * SUBIR PRODUCTOS Y BORRAR LA CUENTA DESDE LA APP (5 nov 2026, Parte 4 y el
 * pedido de Gerencia). Lo que no puede pasar sin que esto se ponga en rojo:
 * que la app enseñe un precio distinto del que se publica, que el formulario
 * decida la tienda o el estado, que las fotos vuelvan a la forma que el fetch
 * de Expo no acepta (pasó: «Unsupported FormDataPart implementation»), que un
 * producto nuevo no aparezca en el catálogo (pasó: la foto del catálogo solo
 * la rehacía el reloj, apagado), o que borrar la cuenta quede a la vista.
 */
const leer = (r: string) => readFileSync(r, "utf-8");

const LLENO: DatosProducto = {
  tituloEs: "Taza",
  tituloEn: "Mug",
  descripcionEs: "",
  descripcionEn: "",
  precio: "12.50",
  existencias: "",
};

describe("el precio que ve el comprador", () => {
  it("es el mismo que publica el sitio, centavo por centavo", () => {
    for (const base of [1, 99, 100, 250, 1000, 1250, 9999, 12345, 250000]) {
      expect(precioPublicadoCentavos(base), String(base)).toBe(
        precioConAjusteCentavos(base),
      );
    }
    expect(precioPublicadoCentavos(0)).toBe(0);
  });

  it("lee lo que escribe la persona sin inventar centavos", () => {
    expect(aCentavos("12.50", "USD")).toBe(1250);
    expect(aCentavos("12,5", "USD")).toBe(1250);
    expect(aCentavos("7", "USD")).toBe(700);
    expect(aCentavos("19990", "CLP")).toBe(19990);
    for (const malo of ["", "0", "-3", "1.234", "abc", "12.5.0"]) {
      expect(aCentavos(malo, "USD"), malo).toBeNull();
    }
  });
});

describe("el formulario del producto", () => {
  it("pide foto, nombre en los dos idiomas y precio, en ese orden", () => {
    expect(faltaEnProducto(LLENO, 0, "USD")).toBe("faltaFoto");
    expect(faltaEnProducto({ ...LLENO, tituloEs: "" }, 1, "USD")).toBe(
      "faltaTituloEs",
    );
    expect(faltaEnProducto({ ...LLENO, tituloEn: "x" }, 1, "USD")).toBe(
      "faltaTituloEn",
    );
    expect(faltaEnProducto({ ...LLENO, precio: "0" }, 1, "USD")).toBe(
      "faltaPrecio",
    );
    expect(faltaEnProducto({ ...LLENO, existencias: "2.5" }, 1, "USD")).toBe(
      "faltaExistencias",
    );
    expect(faltaEnProducto(LLENO, 1, "USD")).toBeNull();
  });

  it("manda solo los textos, limpios", () => {
    expect(
      camposDelProducto({ ...LLENO, tituloEs: " Taza ", precio: "12,50" }),
    ).toEqual({
      tituloEs: "Taza",
      tituloEn: "Mug",
      descripcionEs: "",
      descripcionEn: "",
      precio: "12.50",
      existencias: "",
    });
  });

  it("las fotos van como partes con bytes, nunca con la forma vieja de React Native", () => {
    const fotos = leer("app-movil/src/lib/fotos.ts");
    expect(fotos).toContain("bytes: () => new File(foto.uri).bytes()");
    const pantalla = leer("app-movil/src/app/nuevo-producto.tsx");
    expect(pantalla).toContain('cuerpo.append("fotos", parteDeFoto(foto))');
    expect(pantalla).not.toMatch(/uri:\s*foto\.uri/);
  });

  it("las fotos se achican en el teléfono antes de subir", () => {
    expect(leer("app-movil/src/lib/productos.ts")).toContain(
      "export const LADO_DE_LA_FOTO = 1600;",
    );
    expect(leer("app-movil/src/lib/fotos.ts")).toContain(
      "compress: 0.8, format: SaveFormat.JPEG",
    );
  });

  it("guarda el borrador por cuenta y lo borra al publicar", () => {
    const pantalla = leer("app-movil/src/app/nuevo-producto.tsx");
    expect(pantalla).toMatch(
      /useBorrador\(\s*"nuevo-producto",\s*sesion\?\.user\?\.id,/,
    );
    expect(pantalla.indexOf("await limpiar();")).toBeGreaterThan(
      pantalla.indexOf("respuesta?.ok"),
    );
  });
});

describe("la puerta «mis productos» del servidor", () => {
  const ruta = leer("src/app/datos/app/mi/productos/route.ts");

  it("usa la MISMA acción de la web, en el idioma de la persona", () => {
    expect(ruta).toContain(
      "guardarProducto(limpio, { idioma: contexto.idioma })",
    );
  });

  it("del formulario solo pasan los textos: ni id, ni tienda, ni estado", () => {
    const lista = ruta.slice(
      ruta.indexOf("const CAMPOS = ["),
      ruta.indexOf("] as const;"),
    );
    for (const prohibido of ['"id"', '"tiendaId"', '"estado"']) {
      expect(lista, prohibido).not.toContain(prohibido);
    }
    expect(ruta).toContain('limpio.set("estado", "publicado");');
  });

  it("exige sesión y tienda propia, y no se guarda en ninguna caché", () => {
    expect(ruta).toContain('respuestaDeError("sin_sesion", 401)');
    expect(ruta).toContain('respuestaDeError("sin_tienda", 403)');
    expect(ruta).toContain('"Cache-Control": "private, no-store"');
  });
});

describe("un producto nuevo aparece en el catálogo", () => {
  it("guardar y cambiar de estado rehacen la foto del catálogo de su mercado", () => {
    const acciones = leer("src/lib/productos/acciones.ts");
    const guardar = acciones.slice(
      acciones.indexOf("export async function guardarProducto("),
    );
    expect(guardar.slice(0, guardar.indexOf("\n}\n"))).toContain(
      "await catalogoCambioEnTienda(tiendaId);",
    );
    const estado = acciones.slice(
      acciones.indexOf("export async function cambiarEstadoProducto("),
    );
    expect(estado.slice(0, estado.indexOf("\n}\n"))).toContain(
      "await catalogoCambioEnTienda(producto.tiendaId);",
    );
    const alCambiar = leer("src/lib/catalogo/al-cambiar.ts");
    expect(alCambiar).toContain("await recalcularListados(mercado);");
    expect(alCambiar).toContain("await recalcularConteos(mercado);");
  });
});

describe("borrar la cuenta dentro de la app", () => {
  it("la palabra es la misma de la web, en los dos idiomas", () => {
    expect(palabraDeConfirmacion("es")).toBe(PALABRA_DE_CONFIRMACION.es);
    expect(palabraDeConfirmacion("en")).toBe(PALABRA_DE_CONFIRMACION.en);
    for (const escrito of [
      "BORRAR",
      " delete ",
      "DeleTE",
      "borra",
      "",
      "BORRAR!",
    ]) {
      expect(confirmoElBorrado(escrito), escrito).toBe(
        confirmoElBorradoDelSitio(escrito),
      );
    }
  });

  it("usa la MISMA acción de la web y sus mismos mensajes", () => {
    const ruta = leer("src/app/datos/app/mi/borrar-cuenta/route.ts");
    expect(ruta).toContain(
      'borrarMiCuenta({ palabra: cuerpo.data.palabra, origen: "app" })',
    );
    expect(ruta).toContain('namespace: "borrarCuenta"');
    expect(ruta).toContain("CORREO_CONTACTO");
  });

  it("nunca está a la vista: va dentro del menú de tres puntos", () => {
    const cuenta = leer("app-movil/src/app/(tabs)/cuenta.tsx");
    const menu = cuenta.slice(
      cuenta.indexOf("<MenuTresPuntos"),
      cuenta.indexOf("/>", cuenta.indexOf("<MenuTresPuntos")),
    );
    expect(menu).toContain('router.push("/borrar-cuenta")');
    expect(cuenta.match(/\/borrar-cuenta/g)).toHaveLength(1);
  });
});
