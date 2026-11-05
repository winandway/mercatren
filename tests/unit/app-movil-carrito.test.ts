import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  CANTIDAD_MAXIMA,
  cuantos,
  leerCarrito,
  lineasParaElPedido,
  llaveDelCarrito,
  ponerCantidad,
  sumar,
  totalCentavos,
  type LineaCarrito,
} from "../../app-movil/src/lib/carrito";
import {
  entregaParaElPedido,
  faltaEnEntrega,
} from "../../app-movil/src/lib/pago";
import { fichaParaApp } from "@/lib/app-movil/datos";
import { esquemaEntrega } from "@/lib/pedidos/esquemas";

/**
 * EL CARRITO Y EL PAGO DE LA APP (5 nov 2026, Parte 3b). Lo que no puede pasar
 * sin que esto se ponga en rojo: que la app mande un precio (el servidor lo
 * vuelve a leer: el precio de la app es solo para enseñar), que el pedido no
 * pase por la MISMA acción de la web, que el intento de pago lo arme la app,
 * que se pueda comprar lo que la pausa de ventas cierra, o que la entrega no
 * encaje con el esquema de la web.
 */
const leer = (r: string) => readFileSync(r, "utf-8");
const linea = (id: string, centavos = 1000, cantidad = 1): LineaCarrito => ({
  productoId: id,
  slug: id,
  titulo: id,
  foto: null,
  precio: { centavos, moneda: "USD" },
  cantidad,
});

describe("el carrito", () => {
  it("suma la misma cosa en una sola línea, con tope", () => {
    let c = sumar([], linea("a"));
    c = sumar(c, linea("a", 1000, 2));
    expect(c).toHaveLength(1);
    expect(c[0]!.cantidad).toBe(3);
    expect(sumar(c, linea("a", 1000, 500))[0]!.cantidad).toBe(CANTIDAD_MAXIMA);
  });

  it("cambiar a cero quita la línea; cuenta y totaliza", () => {
    const c = [linea("a", 1000, 2), linea("b", 250, 4)];
    expect(cuantos(c)).toBe(6);
    expect(totalCentavos(c)).toBe(3000);
    expect(ponerCantidad(c, "a", 0).map((l) => l.productoId)).toEqual(["b"]);
  });

  it("al servidor SOLO viajan el producto y la cantidad, nunca el precio", () => {
    const enviado = lineasParaElPedido([linea("a", 1, 2)]);
    expect(enviado).toEqual([{ productoId: "a", cantidad: 2 }]);
    expect(JSON.stringify(enviado)).not.toContain("centavos");
  });

  it("un carrito por país, y lo guardado raro no lo tumba", () => {
    expect(llaveDelCarrito("US")).not.toBe(llaveDelCarrito("ES"));
    expect(leerCarrito("no es json")).toEqual([]);
    expect(
      leerCarrito(
        '[{"productoId":"a"},{"productoId":"b","cantidad":1,"precio":{"centavos":5}}]',
      ),
    ).toHaveLength(1);
  });
});

describe("la entrega", () => {
  const d = {
    nombre: "Persona Compradora",
    telefono: "3055550100",
    direccion: "100 Main Street",
    direccion2: "",
    ciudad: "Miami",
    estado: "fl",
    codigoPostal: "33101",
  };

  it("pide estado de dos letras y código postal válido", () => {
    expect(faltaEnEntrega({ ...d, estado: "F" })).toBe("faltaEstado");
    expect(faltaEnEntrega({ ...d, codigoPostal: "331" })).toBe(
      "faltaCodigoPostal",
    );
    expect(faltaEnEntrega(d)).toBeNull();
  });

  it("lo que manda la app pasa el MISMO esquema de entrega de la web", () => {
    const e = entregaParaElPedido(d);
    expect(e.estado).toBe("FL");
    expect(esquemaEntrega.safeParse(e).success).toBe(true);
  });
});

describe("el pedido y el pago", () => {
  const ruta = leer("src/app/datos/app/mi/pedido/route.ts");

  it("el pedido lo crea la MISMA acción de la web, en el idioma de la persona", () => {
    expect(ruta).toContain("await crearPedido(");
    expect(ruta).toContain("{ idioma: contexto.idioma }");
    expect(ruta).toContain('metodoPago: "stripe"');
  });

  it("de la app no pasa ningún precio: el esquema solo acepta producto y cantidad", () => {
    const lineas = ruta.slice(
      ruta.indexOf("lineas: z"),
      ruta.indexOf(".min(1)\n    .max(50)"),
    );
    expect(lineas).toContain("productoId:");
    expect(lineas).toContain("cantidad:");
    expect(lineas).not.toMatch(/precio|centavos|total/i);
  });

  it("el intento de pago lo arma el servidor con la MISMA acción de la web", () => {
    expect(ruta).toContain("await crearIntentoDePago(pedido.numero)");
    expect(leer("src/app/datos/app/mi/pagar/route.ts")).toContain(
      "crearIntentoDePago(cuerpo.data.numero)",
    );
    const cobrar = leer("app-movil/src/lib/cobrar.ts");
    expect(cobrar).toContain("paymentIntentClientSecret: pago.clientSecret");
    /* Sin comentarios: la app no fija ningún monto, solo enseña el intento. */
    const codigo = cobrar.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(codigo).not.toMatch(/amount|monto/i);
  });

  it("exige sesión antes de crear nada", () => {
    expect(ruta.indexOf('respuestaDeError("sin_sesion", 401)')).toBeLessThan(
      ruta.indexOf("await crearPedido("),
    );
  });
});

describe("la pausa de ventas se respeta en la app", () => {
  const ficha = {
    producto: {
      id: "p",
      slug: "p",
      marca: null,
      tituloEs: "x",
      tituloEn: null,
      descripcionEs: null,
      descripcionEn: null,
      precioCentavos: 100,
      precioAntesCentavos: null,
      moneda: "USD",
      existencias: 3,
      controlaExistencias: true,
      unidad: null,
    },
    tiendaNombre: "t",
    tiendaSlug: "t",
    categoriaNombreEs: null,
    categoriaNombreEn: null,
    imagenes: [],
  };

  it("la ficha dice si se vende, con la MISMA pausa de la web", () => {
    expect(fichaParaApp({ ...ficha, tiendaPais: "ES" }, "es").seVende).toBe(
      false,
    );
    expect(fichaParaApp({ ...ficha, tiendaPais: "VE" }, "es").seVende).toBe(
      true,
    );
  });

  it("sin «se vende», la ficha no ofrece agregar al carrito", () => {
    const pantalla = leer("app-movil/src/app/producto/[slug].tsx");
    expect(pantalla).toMatch(
      /f\.seVende === false \?[\s\S]*noSeVende[\s\S]*: !f\.agotado \?/,
    );
  });
});
