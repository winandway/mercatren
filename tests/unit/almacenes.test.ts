import { describe, expect, it } from "vitest";

import {
  ALMACENES,
  ALMACEN_POR_DEFECTO,
  almacenDeLaTienda,
  flechasDesde,
  nombreDelAlmacen,
} from "@/lib/destino/almacenes";

/**
 * EL ALMACÉN QUE ENSEÑA CADA TIENDA.
 *
 * Todas las tiendas marcando el mismo punto se leería como lo que sería: un
 * solo almacén con varios nombres. Repartirlos es lo que hace que se lean como
 * operaciones distintas — y eso es lo que da confianza.
 */
describe("el almacén de cada tienda", () => {
  it("SIEMPRE es el mismo para la misma tienda", () => {
    /* Si cambiara entre una visita y otra, un comprador que vuelve vería el
       almacén mudarse de estado — justo lo contrario de la confianza que esto
       viene a construir. */
    const uno = almacenDeLaTienda("tienda-us-ropa-calzado");
    for (let i = 0; i < 20; i++) {
      expect(almacenDeLaTienda("tienda-us-ropa-calzado")).toBe(uno);
    }
  });

  it("tiendas distintas se reparten en varios estados", () => {
    const tiendas = [
      "tienda-mercatren-us",
      "tienda-us-ropa-calzado",
      "tienda-us-repuestos-carro",
      "tienda-us-mascotas",
      "tienda-us-cocina-comedor",
      "tienda-us-electronica",
      "tienda-us-hogar-muebles",
    ];
    const estados = new Set(tiendas.map(almacenDeLaTienda));

    /* Que alguno se repita está bien —el dueño lo dijo—, lo que no puede pasar
       es que todas caigan en el mismo. */
    expect(estados.size).toBeGreaterThanOrEqual(3);
  });

  it("el que devuelve siempre existe de verdad en el mapa", () => {
    /* Un estado inventado dibujaría el punto en el vacío o rompería el mapa. */
    for (const semilla of ["a", "zzz", "tienda-us-x", "", "ñ", "123456789"]) {
      expect(ALMACENES[almacenDeLaTienda(semilla)]).toBeDefined();
    }
  });

  it("sin identificador cae en el de siempre, no en nada", () => {
    expect(almacenDeLaTienda(null)).toBe(ALMACEN_POR_DEFECTO);
    expect(almacenDeLaTienda(undefined)).toBe(ALMACEN_POR_DEFECTO);
    expect(almacenDeLaTienda("   ")).toBe(ALMACEN_POR_DEFECTO);
  });

  it("todos los puntos caen DENTRO del dibujo del mapa", () => {
    /* El mapa ocupa más o menos de 90 a 740 en horizontal y de 150 a 620 en
       vertical dentro del lienzo de 800. Un punto fuera se dibujaría en el
       océano — y eso pasó de verdad con Nueva Jersey en la primera pasada. */
    for (const [clave, a] of Object.entries(ALMACENES)) {
      expect(a.x, `${clave} x`).toBeGreaterThan(120);
      expect(a.x, `${clave} x`).toBeLessThan(720);
      expect(a.y, `${clave} y`).toBeGreaterThan(180);
      expect(a.y, `${clave} y`).toBeLessThan(600);
    }
  });

  it("el nombre sale en el idioma de quien mira", () => {
    expect(nombreDelAlmacen("nueva-jersey", "es")).toBe("Nueva Jersey");
    expect(nombreDelAlmacen("nueva-jersey", "en")).toBe("New Jersey");
    /* Una clave que no existe no puede dejar la etiqueta vacía. */
    expect(nombreDelAlmacen("no-existe", "es")).toBeTruthy();
  });

  it("ninguna flecha apunta al propio almacén", () => {
    /* Una flecha de un punto a ese mismo punto se dibuja como un garabato, y
       es lo primero que se nota como error. */
    for (const a of Object.values(ALMACENES)) {
      for (const d of flechasDesde(a)) {
        expect(Math.hypot(d.x - a.x, d.y - a.y)).toBeGreaterThan(80);
      }
    }
  });

  it("siempre quedan flechas que dibujar", () => {
    /* Un mapa con el punto y ninguna ruta no dice «despachamos a todo el
       país»: dice que ahí hay una bodega y nada más. */
    for (const a of Object.values(ALMACENES)) {
      expect(flechasDesde(a).length).toBeGreaterThanOrEqual(3);
    }
  });
});
