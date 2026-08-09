import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  ESTADOS_VERIFICACION,
  estadoDeVerificacion,
  estaEnVigilancia,
  luceElSello,
  VERIFICACION_POR_DEFECTO,
  visibleParaElComercio,
  type EstadoVerificacion,
} from "@/lib/verificacion/estado";

/**
 * LA VERIFICACIÓN DE UN COMERCIO.
 *
 * De dónde salió (9 ago 2026): el registro se abre para que cualquiera pueda
 * vender desde el primer minuto, sin esperar aprobación. Pero hasta hoy el
 * sello verde de «Empresa verificada» se le dibujaba a TODA tienda sin mirar
 * nada — así que el primero que viniera a estafar se llevaba nuestro respaldo
 * puesto en su ficha.
 */
describe("el sello verde solo lo lleva quien lo ganó", () => {
  it("una tienda verificada sí lo luce", () => {
    expect(luceElSello("verificada")).toBe(true);
  });

  it("una en observación NO, aunque esté vendiendo con normalidad", () => {
    /* Vender y estar verificada son cosas distintas: el sello no es un permiso
       para vender, es lo que nosotros AFIRMAMOS sobre ese comercio. */
    expect(luceElSello("en_observacion")).toBe(false);
  });

  it("y una rechazada tampoco", () => {
    expect(luceElSello("rechazada")).toBe(false);
  });

  it("de los tres estados, EXACTAMENTE uno lo enciende", () => {
    /* Si alguien agrega un estado nuevo y lo deja luciendo el sello sin
       pensarlo, esta prueba lo para. */
    const conSello = ESTADOS_VERIFICACION.filter(luceElSello);
    expect(conSello).toEqual(["verificada"]);
  });
});

/**
 * LO SEGURO POR DEFECTO ES NO ESTAR VERIFICADO.
 *
 * Es la línea que más importa: si un día se agrega una tienda por un camino
 * que olvida crear su fila, lo peor que puede pasar es que no luzca el sello.
 * Nunca que se lo lleve sin haberlo ganado.
 */
describe("lo que pasa cuando no hay dato", () => {
  it("una tienda sin fila de verificación NO está verificada", () => {
    expect(VERIFICACION_POR_DEFECTO).toBe("en_observacion");
    expect(luceElSello(VERIFICACION_POR_DEFECTO)).toBe(false);
  });

  it("un valor nulo, vacío o desconocido cae en observación", () => {
    for (const raro of [null, undefined, "", "activa", "aprobada", "SÍ"]) {
      expect(estadoDeVerificacion(raro), String(raro)).toBe("en_observacion");
    }
  });

  it("un valor bueno se respeta tal cual", () => {
    for (const bueno of ESTADOS_VERIFICACION) {
      expect(estadoDeVerificacion(bueno)).toBe(bueno);
    }
  });

  it("NUNCA devuelve algo fuera de la lista", () => {
    const validos = new Set<string>(ESTADOS_VERIFICACION);
    for (const raro of [null, "verificado", "VERIFICADA", "1", "true"]) {
      expect(validos.has(estadoDeVerificacion(raro))).toBe(true);
    }
  });
});

/**
 * LA ZONA DE VIGILANCIA DEL PANEL.
 *
 * Palabras del dueño: hoy, al aceptar a alguien, «se revuelve con los que ya
 * están aceptados, y solo hay una diferencia de un botón entre tantos
 * botones». Una lista donde lo revisado y lo no revisado conviven es una lista
 * que nadie revisa.
 */
describe("quién sale en la zona de vigilancia", () => {
  it("las que están en observación", () => {
    expect(estaEnVigilancia("en_observacion")).toBe(true);
  });

  it("las rechazadas también: son las que MÁS hay que seguir mirando", () => {
    expect(estaEnVigilancia("rechazada")).toBe(true);
  });

  it("las verificadas salen de ahí — ese es el punto de verificarlas", () => {
    expect(estaEnVigilancia("verificada")).toBe(false);
  });

  it("verificar es exactamente lo contrario de estar vigilada", () => {
    for (const e of ESTADOS_VERIFICACION) {
      expect(estaEnVigilancia(e)).toBe(!luceElSello(e));
    }
  });
});

/**
 * EL COMERCIANTE NO SE ENTERA.
 *
 * Decisión del dueño. Si supiera que está «en observación» se sentiría
 * vigilado y sospechoso desde el primer día, cuando es lo normal de cualquier
 * comercio que entra. Y quien viene a estafar, sabiendo que lo miran, se porta
 * bien justo el tiempo que dure la mirada.
 */
describe("el comercio no ve nada de esto", () => {
  it("nunca se le enseña su estado", () => {
    expect(visibleParaElComercio()).toBe(false);
  });

  it("ninguna pantalla DEL COMERCIO lee el estado de verificación", () => {
    /* La comprobación de verdad: que el módulo no se cuele en las pantallas
       que ve el comerciante. Si alguien lo importa ahí, aunque sea para un
       aviso bienintencionado, esta prueba lo caza. */
    const raiz = join(import.meta.dirname, "..", "..", "src");
    const suyas = [
      join(raiz, "app", "[locale]", "panel", "mi-tienda"),
      join(raiz, "components", "panel", "mi-tienda"),
    ];

    const archivos = (dir: string): string[] => {
      try {
        return readdirSync(dir).flatMap((n) => {
          const r = join(dir, n);
          return statSync(r).isDirectory()
            ? archivos(r)
            : /\.tsx?$/.test(n)
              ? [r]
              : [];
        });
      } catch {
        return [];
      }
    };

    for (const ruta of suyas.flatMap(archivos)) {
      const codigo = readFileSync(ruta, "utf8");
      expect(
        codigo.includes("verificacion/estado"),
        `${ruta} lee el estado de verificación, y esa pantalla la ve el comercio`,
      ).toBe(false);
    }
  });
});

describe("los estados que hay", () => {
  it("son tres y no cambian sin que alguien lo note", () => {
    const esperados: EstadoVerificacion[] = [
      "en_observacion",
      "verificada",
      "rechazada",
    ];
    expect([...ESTADOS_VERIFICACION]).toEqual(esperados);
  });
});
