import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

/**
 * LOS CANDADOS DE «TRAER EL ALMACÉN COMPLETO» (2 sep 2026).
 *
 * Las reglas puras se prueban en `cj-masivo.test.ts`. Aquí se fija lo que
 * las funciones de servidor no pueden dejar de hacer, leyendo el código:
 * son las piezas que, si alguien las relaja, cuestan dinero en silencio.
 */
const leer = (ruta: string) => readFileSync(ruta, "utf-8");

describe("el servidor de la importación", () => {
  const fuente = leer("src/lib/cj/masivo-servidor.ts");

  it("UN ESTIMADO NUNCA PISA UNA COTIZACIÓN REAL", () => {
    expect(fuente).toContain('previo?.envioOrigen === "cotizado"');
    /* Lo nuevo entra marcado como estimado: es lo que el afinado busca. */
    expect(fuente).toContain('origen: "estimado"');
  });

  it("respeta el tope de 6.000 de CJ: parte en bandas lo que se topa", () => {
    expect(fuente).toContain("reglas.estaTopada(total)");
    expect(fuente).toContain("reglas.bandasPara(tanda)");
    expect(fuente).toContain("reglas.ULTIMA_PAGINA");
  });

  it("el reclamo de tandas es un UPDATE condicionado, nunca un select y luego un update sueltos", () => {
    expect(fuente).toContain(".returning({");
    expect(fuente).toMatch(
      /and\(\s*eq\(tandasImportacionCj\.id,\s*candidata\.id\),\s*disponible,?\s*\)/,
    );
  });

  it("una tanda cortada por tiempo se SUELTA para que el próximo la siga", () => {
    expect(fuente).toMatch(
      /\.set\(\{\s*estado:\s*"pendiente",\s*tomadaEn:\s*null,?\s*\}\)/,
    );
  });

  it("solo publica lo que pasa el filtro de stock y tiene precio en su plaza", () => {
    expect(fuente).toContain("reglas.pasaElFiltro(ficha, ctx.stockMinimo)");
    expect(fuente).toMatch(
      /precioPublicadoDe\(\s*ctx\.plaza,\s*ficha\.costoCentavos,\s*envio,\s*ctx\.tasa,?\s*\)/,
    );
    expect(fuente).toContain("if (!precio.ok) {");
  });

  it("todo lo que le habla a CJ respeta el ritmo de una por segundo", () => {
    expect(fuente).toContain("llamarCjConRitmo");
    expect(fuente).not.toMatch(/\bllamarCj\(/);
    const afinar = leer("src/lib/cj/afinar.ts");
    expect(afinar).toContain("await esperar(ESPERA_MS)");
  });
});

describe("el afinado", () => {
  const fuente = leer("src/lib/cj/afinar.ts");

  it("la ropa primero: es lo único que no se vende bien sin talla", () => {
    expect(fuente).toContain("DEPARTAMENTO_CON_TALLAS");
    expect(fuente).toContain("then 0 else 1 end");
  });

  it("deja el flete REAL, las tallas y el stock, en dos llamadas y no tres", () => {
    expect(fuente).toContain('origen: "cotizado"');
    /* Tolerante al salto de línea de prettier: lo que importa son los seis
       argumentos, el último las variantes ya pedidas. */
    expect(fuente).toMatch(
      /guardarTallas\(\s*p\.id,\s*p\.pid,\s*plaza\.almacen,\s*precio\.publicadoCentavos,\s*ahora,\s*lista,?\s*\)/,
    );
    expect(fuente).toContain("cotizarFlete(elegida.vid, plaza)");
  });

  it("en Chile, lo que pasa del tope con el flete real se pasa a BORRADOR, no se vende", () => {
    expect(fuente).toContain('{ estado: "borrador" as const }');
  });
});

describe("las puertas del panel y el reloj", () => {
  it("cada acción exige soporte DE VERDAD (sin el disfraz de «ver su panel»)", () => {
    const acciones = leer("src/lib/cj/masivo-acciones.ts");
    const exportadas = acciones.match(/export async function /g)?.length ?? 0;
    const guardadas =
      acciones.match(/await esSoporteDeVerdad\(\)/g)?.length ?? 0;
    expect(exportadas).toBeGreaterThanOrEqual(6);
    expect(guardadas).toBe(exportadas);
    /* Lo que entra por formulario pasa por zod. */
    expect(acciones).toContain("Formulario.safeParse(");
  });

  it("el reloj empuja la importación, afina y traduce, cada uno en su propio try", () => {
    const reloj = leer("src/app/datos/sincronizar/route.ts");
    expect(reloj).toContain("avanzarImportacionesEnCurso(");
    expect(reloj).toContain("afinarImportados({");
    expect(reloj).toContain("traducirDesdeElReloj({");
  });

  it("los ayudantes compartidos viven en guardar.ts (server-only), no exportados desde un «use server»", () => {
    const guardar = leer("src/lib/cj/guardar.ts");
    expect(guardar.startsWith('import "server-only";')).toBe(true);
    for (const fn of [
      "tiendaDelRubro",
      "tiendaGeneralDePlaza",
      "tiendaMayorista",
      "fuenteDeCj",
    ]) {
      expect(guardar).toContain(`export async function ${fn}(`);
    }
    const importar = leer("src/lib/cj/importar.ts");
    expect(importar).not.toContain("async function tiendaDelRubro(");
  });

  it("el feed de Google sale en flujo, de a tandas por id", () => {
    const feed = leer("src/app/datos/google/route.ts");
    expect(feed).toContain("new ReadableStream<Uint8Array>");
    expect(feed).toContain("gt(productos.id, cursor)");
    expect(feed).toContain(".orderBy(asc(productos.id))");
  });
});
