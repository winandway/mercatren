import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  FOTOS_POR_HORA,
  FOTOS_POR_TICK,
  INTENTOS_PARA_DAR_POR_ROTA,
  cuotaDisponible,
  esFalloDefinitivo,
  fotosPorHoraDe,
  horaDe,
  marcaDeCuota,
  motivoDe,
  seDaPorRota,
} from "@/lib/catalogo/fotos-reglas";

/**
 * LAS FOTOS SE TRAEN SOLAS (3 sep 2026). El dueño mandó la portada con tres
 * productos sin foto: el servidor del comercio falla a ratos. Pidió que se
 * copien solas a nuestros servidores, «unas 120 por día, 10 por hora», y que
 * el vigilante descubra y resuelva esto.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");
const AHORA = Date.parse("2026-09-03T15:20:00Z");

describe("la cuota por hora", () => {
  it("son 10 por hora y 2 por latido, como pidió el dueño («unas 10 por hora»)", () => {
    expect(FOTOS_POR_HORA).toBe(10);
    expect(FOTOS_POR_TICK).toBe(2);
    /* Las 24 horas del reloj: 240 al día. Si algún día se quiere menos, es
       `configuracion.fotos_por_hora`, no tocar la constante. */
    expect(FOTOS_POR_HORA * 24).toBe(240);
  });

  it("sin marca, o con marca de otra hora, la cuota está entera", () => {
    expect(cuotaDisponible(null, AHORA)).toBe(10);
    expect(cuotaDisponible(`${horaDe(AHORA) - 1}:10`, AHORA)).toBe(10);
  });

  it("dentro de la hora se descuenta lo gastado y nunca baja de cero", () => {
    expect(cuotaDisponible(`${horaDe(AHORA)}:7`, AHORA)).toBe(3);
    expect(cuotaDisponible(`${horaDe(AHORA)}:10`, AHORA)).toBe(0);
    expect(cuotaDisponible(`${horaDe(AHORA)}:99`, AHORA)).toBe(0);
  });

  it("una marca rota no bloquea el reloj: ante la duda se trabaja", () => {
    expect(cuotaDisponible("basura", AHORA)).toBe(10);
    expect(cuotaDisponible("x:y", AHORA)).toBe(10);
  });

  it("la marca nueva suma dentro de la hora y arranca de cero al cambiar de hora", () => {
    expect(marcaDeCuota(null, AHORA, 2)).toBe(`${horaDe(AHORA)}:2`);
    expect(marcaDeCuota(`${horaDe(AHORA)}:7`, AHORA, 2)).toBe(
      `${horaDe(AHORA)}:9`,
    );
    expect(marcaDeCuota(`${horaDe(AHORA) - 1}:7`, AHORA, 2)).toBe(
      `${horaDe(AHORA)}:2`,
    );
  });

  it("el tope guardado manda si es cuerdo; cero o basura NO apagan el copiado", () => {
    expect(fotosPorHoraDe("30")).toBe(30);
    expect(fotosPorHoraDe("0")).toBe(FOTOS_POR_HORA);
    expect(fotosPorHoraDe("hola")).toBe(FOTOS_POR_HORA);
    expect(fotosPorHoraDe("100000")).toBe(FOTOS_POR_HORA);
  });
});

describe("cuándo una foto se da por perdida", () => {
  it("404 y 410 son definitivos; 429, 5xx y un corte de red son pasajeros", () => {
    expect(esFalloDefinitivo(404)).toBe(true);
    expect(esFalloDefinitivo(410)).toBe(true);
    expect(esFalloDefinitivo(429)).toBe(false);
    expect(esFalloDefinitivo(503)).toBe(false);
    expect(esFalloDefinitivo(null)).toBe(false);
  });

  it("un fallo pasajero solo la da por perdida después de varios intentos", () => {
    expect(seDaPorRota(429, 1)).toBe(false);
    expect(seDaPorRota(null, INTENTOS_PARA_DAR_POR_ROTA - 1)).toBe(false);
    expect(seDaPorRota(null, INTENTOS_PARA_DAR_POR_ROTA)).toBe(true);
    expect(seDaPorRota(404, 1)).toBe(true);
  });

  it("el motivo es corto y legible", () => {
    expect(motivoDe(404)).toBe("HTTP 404");
    expect(motivoDe(null, new Error("fetch failed"))).toBe("fetch failed");
    expect(motivoDe(null, undefined)).toBe("sin respuesta");
  });
});

describe("candados en el código", () => {
  it("el reloj trae fotos en cada latido, después de la traducción", () => {
    const tick = leer("src/lib/reloj/tick.ts");
    expect(tick).toContain("traerFotosDesdeElReloj()");
    expect(tick.indexOf("traerFotosDesdeElReloj(")).toBeGreaterThan(
      tick.indexOf("traducirDesdeElReloj("),
    );
  });

  it("la tarjeta, la galería y el buscador NO enseñan una foto dada por perdida", () => {
    const consultas = leer("src/lib/catalogo/consultas.ts");
    expect(consultas).toContain(
      "fr.definitiva = 1 AND fr.url = imagenes_producto.url",
    );
    /* La foto de turno (tarjeta) y la galería (ficha) pasan por el filtro. */
    expect(consultas).toMatch(
      /productos\.id\} AND \$\{SIN_FOTOS_ROTAS\} ORDER BY \$\{turno\}/,
    );
    expect(consultas).toMatch(/fila\.producto\.id\),\s*SIN_FOTOS_ROTAS/);
    const buscar = leer("src/lib/catalogo/buscar.ts");
    expect(buscar.match(/fr\.definitiva = 1/g)?.length).toBe(2);
  });

  it("si el navegador no logra cargar la foto, la tarjeta y la galería enseñan «sin foto», no el título desparramado", () => {
    expect(leer("src/components/catalogo/tarjeta-producto.tsx")).toContain(
      "<FotoConRespaldo",
    );
    expect(leer("src/components/catalogo/galeria-producto.tsx")).toContain(
      "<FotoConRespaldo",
    );
    const respaldo = leer("src/components/catalogo/foto-con-respaldo.tsx");
    expect(respaldo).toContain('"use client"');
    expect(respaldo).toContain("onError={() => setRota(true)}");
  });

  it("el botón del panel y el reloj usan el MISMO copiador", () => {
    expect(leer("src/lib/catalogo/traer-fotos.ts")).toContain(
      "copiarFotoAlBucket(env.BUCKET",
    );
    expect(leer("src/lib/catalogo/fotos-automaticas.ts")).toContain(
      "copiarFotoAlBucket(env.BUCKET",
    );
  });

  it("la tabla fotos_rotas viaja en schema.sql (tabla, no columna)", () => {
    expect(leer("schema.sql")).toContain(
      "CREATE TABLE IF NOT EXISTS `fotos_rotas`",
    );
  });

  it("el vigilante mide las fotos, las sondea y actúa", () => {
    const hechos = leer("src/lib/vigilante/hechos.ts");
    expect(hechos).toContain("sondearFotosDeOrigen(");
    expect(hechos).toContain("contarFotosRotas()");
    expect(leer("src/lib/vigilante/correr.ts")).toContain(
      "traerFotosDesdeElReloj({ maximo: 4 })",
    );
  });

  it("la cuota se gasta por intento, no por éxito (a un origen caído no se le insiste)", () => {
    const auto = leer("src/lib/catalogo/fotos-automaticas.ts");
    expect(auto).toContain("const gastadas = copiadas + fallidas;");
  });
});
