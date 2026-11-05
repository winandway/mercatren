import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  igualQueLoGuardado,
  urlFotoDeMiProducto,
  urlMiProducto,
  urlMisVentas,
  urlVenta,
} from "../../app-movil/src/lib/ventas";
import {
  formularioDeEdicion,
  textoDeMonto,
  type ProductoGuardado,
} from "@/lib/app-movil/editar-producto";
import { baseDesdePublicado, precioConAjusteCentavos } from "@/lib/dinero";
import { lineasDeLaEntrega } from "@/lib/pedidos/direccion-de-entrega";

/**
 * «MIS VENTAS» Y EDITAR UN PRODUCTO DESDE LA APP (5 nov 2026).
 *
 * Lo que no puede pasar sin que esto se ponga en rojo:
 * - que editar desde el teléfono borre en silencio lo que la app no enseña
 *   (departamento, marca, SKU, precio «antes», depósito, destacado);
 * - que un comercio vea o mueva una venta que no es suya;
 * - que la app tenga otros botones que el panel web para cerrar una venta;
 * - que la app pida a una ruta que no existe.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");

const GUARDADO: ProductoGuardado = {
  sku: "SKU-1",
  categoriaId: "dep-hogar",
  marca: "Marca propia",
  unidad: "caja",
  precioAntesCentavos: precioConAjusteCentavos(3000),
  moneda: "USD",
  destacado: true,
  estado: "publicado",
  zonaDeposito: null,
};

describe("editar desde la app conserva lo que la app no enseña", () => {
  const f = formularioDeEdicion("p1", GUARDADO, {
    tituloEs: "Lámpara de mesa",
    tituloEn: "Table lamp",
    descripcionEs: "",
    descripcionEn: "",
    precio: "25",
    existencias: "",
    /* Lo que no es de la app no pasa aunque venga en el formulario. */
    estado: "borrador",
    tiendaId: "otra",
  });

  it("el departamento, la marca, el SKU, la unidad y el destacado siguen", () => {
    expect(f.id).toBe("p1");
    expect(f.sku).toBe("SKU-1");
    expect(f.categoriaId).toBe("dep-hogar");
    expect(f.marca).toBe("Marca propia");
    expect(f.unidad).toBe("caja");
    expect(f.destacado).toBe("on");
  });

  it("el precio «antes» vuelve como precio del comercio, sin sumar el ajuste dos veces", () => {
    expect(f.precioAntes).toBe("30.00");
    expect(baseDesdePublicado(precioConAjusteCentavos(3000))).toBe(3000);
  });

  it("el estado no lo cambia la edición, y la tienda no la decide la app", () => {
    expect(f.estado).toBe("publicado");
    expect(f.tiendaId).toBeUndefined();
  });

  it("lo de la app manda, y sin unidades no se lleva la cuenta", () => {
    expect(f.tituloEs).toBe("Lámpara de mesa");
    expect(f.precio).toBe("25");
    expect(f.controlaExistencias).toBeUndefined();
    const conUnidades = formularioDeEdicion("p1", GUARDADO, {
      existencias: "4",
    });
    expect(conUnidades.controlaExistencias).toBe("on");
  });

  it("la ciudad del depósito sigue (Venezuela) y los pesos van sin decimales", () => {
    expect(
      formularioDeEdicion("p1", { ...GUARDADO, zonaDeposito: "maracay" }, {})
        .ciudadDeposito,
    ).toBe("maracay");
    expect(textoDeMonto(19990, "CLP")).toBe("19990");
    expect(textoDeMonto(2599, "USD")).toBe("25.99");
  });
});

describe("la ruta de editar usa la pieza y la acción de la web", () => {
  const ruta = leer("src/app/datos/app/mi/productos/[id]/route.ts");

  it("arma el formulario con lo guardado y guarda con guardarProducto", () => {
    expect(ruta).toContain("formularioDeEdicion(");
    expect(ruta).toContain("guardarProducto(limpio, { idioma: r.idioma })");
    expect(ruta).toContain("eq(tiendas.propietarioId, usuarioId)");
    expect(ruta).toContain('"no_editable"');
  });

  it("pausar o publicar es la misma acción del panel", () => {
    expect(ruta).toContain("cambiarEstadoProducto(r.producto.id");
  });

  it("la última foto no se quita", () => {
    const fotos = leer(
      "src/app/datos/app/mi/productos/[id]/fotos/[foto]/route.ts",
    );
    expect(fotos).toContain('"ultima_foto"');
    expect(fotos).toContain("eq(tiendas.propietarioId, usuario.id)");
    expect(fotos).toContain("borrarFoto(foto, { idioma: contexto.idioma })");
  });
});

describe("mis ventas: solo lo mío, con los mismos botones del panel", () => {
  const lista = leer("src/app/datos/app/mi/ventas/route.ts");
  const una = leer("src/app/datos/app/mi/ventas/[numero]/route.ts");
  const acciones = leer("src/lib/pedidos/acciones.ts");

  it("la lista es la de Órdenes, acotada a mi tienda", () => {
    expect(lista).toContain("listarPedidosDelPanel({ comercio: tienda.slug");
    expect(lista).toContain("if (!r.soloDeEsteComercio)");
  });

  it("el detalle solo enseña mis renglones; sin renglones míos, no existe", () => {
    expect(una).toContain("(r) => r.tiendaId === tienda.id");
    expect(una).toContain("renglones.length === 0");
  });

  it("los botones salen de la misma tabla que avanzarPedido", () => {
    expect(acciones).toContain('pagado: ["enviado", "entregado"]');
    expect(acciones).toContain('preparando: ["enviado", "entregado"]');
    expect(acciones).toContain('enviado: ["entregado"]');
    expect(una).toContain('new Set(["pagado", "preparando"])');
    expect(una).toContain('new Set(["pagado", "preparando", "enviado"])');
    expect(una).toContain("puedeMarcarEntrega(r.usuario.rol)");
    expect(una).toContain(
      "avanzarPedido(r.pedido.numero, datos.data.estado, {",
    );
  });
});

describe("lo que la app pide y enseña", () => {
  it("van a la puerta privada de datos, con país e idioma", () => {
    expect(urlMisVentas("US", "es")).toMatch(
      /\/datos\/app\/mi\/ventas\?pais=US&idioma=es$/,
    );
    expect(urlVenta("MT-000270", "US", "en")).toMatch(
      /\/datos\/app\/mi\/ventas\/MT-000270\?pais=US&idioma=en$/,
    );
    expect(urlMiProducto("a b", "US", "es")).toContain("/mi/productos/a%20b?");
    expect(urlFotoDeMiProducto("p", "f", "US", "es")).toContain(
      "/mi/productos/p/fotos/f?",
    );
    for (const ruta of [
      "ventas/route.ts",
      "ventas/[numero]/route.ts",
      "productos/[id]/route.ts",
      "productos/[id]/fotos/[foto]/route.ts",
    ]) {
      expect(existsSync(`src/app/datos/app/mi/${ruta}`), ruta).toBe(true);
    }
  });

  it("la dirección sale entera, con la calle, en el panel, la factura y la app", () => {
    /* La compra guarda la calle en `direccion`; el panel buscaba `linea1`. */
    const guardada = {
      nombre: "Nombre",
      pais: "US",
      ciudad: "Miami",
      direccion: "100 Main Street",
      direccion2: "",
      estado: "FL",
      codigoPostal: "33101",
      referencia: "",
    };
    expect(lineasDeLaEntrega(guardada)).toEqual([
      "Nombre",
      "100 Main Street",
      "Miami, FL 33101",
      "US",
    ]);
    expect(lineasDeLaEntrega(guardada, { conNombre: false })[0]).toBe(
      "100 Main Street",
    );
    /* La forma vieja también se entiende. */
    expect(lineasDeLaEntrega({ linea1: "Calle 1", ciudad: "Caracas" })).toEqual(
      ["Calle 1", "Caracas"],
    );
    expect(lineasDeLaEntrega(null)).toEqual([]);
    for (const archivo of [
      "src/app/[locale]/panel/ordenes/[numero]/page.tsx",
      "src/app/datos/app/mi/ventas/[numero]/route.ts",
      "src/lib/facturas/emitir.ts",
      "src/lib/pedidos/ficha-para-el-equipo.ts",
    ]) {
      expect(leer(archivo), archivo).toContain("lineasDeLaEntrega(");
    }
    expect(
      leer("src/app/[locale]/panel/ordenes/[numero]/page.tsx"),
    ).not.toContain('"linea1"');
  });

  it("abrir un producto y salir sin tocar nada no deja borrador", () => {
    const g = { a: "x", b: "y" };
    expect(igualQueLoGuardado({ a: "x ", b: "y" }, g)).toBe(true);
    expect(igualQueLoGuardado({ a: "z", b: "y" }, g)).toBe(false);
  });

  it("Mi tienda abre cada producto para editarlo y lleva a Mis ventas", () => {
    const tienda = leer("app-movil/src/app/mi-tienda.tsx");
    expect(tienda).toContain('pathname: "/editar-producto/[id]"');
    expect(tienda).toContain('router.push("/mis-ventas")');
    const raiz = leer("app-movil/src/app/_layout.tsx");
    for (const pantalla of [
      "mis-ventas",
      "venta/[numero]",
      "editar-producto/[id]",
    ]) {
      expect(raiz, pantalla).toContain(`name="${pantalla}"`);
    }
  });
});
