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

  it("LA BASE DE LA NUBE ADMITE 100 VALORES POR SENTENCIA: las tandas entran de a pocas", () => {
    /* La primera corrida real (2 sep 2026) murió con 20 categorías por
       sentencia: 20 × 15 columnas = 300 valores. Se multiplica contra las
       columnas REALES de la tabla, así que agregar una columna que rompa el
       tope también se pone rojo. */
    /* Las columnas se cuentan en `schema.sql` (lo que de verdad corre en la
       nube), sin importar el esquema: importarlo arrastra medio proyecto a la
       medición de cobertura. */
    const ddl = leer("schema.sql");
    const bloque =
      /CREATE TABLE IF NOT EXISTS `tandas_importacion_cj` \(([\s\S]*?)\n\);/.exec(
        ddl,
      );
    expect(bloque).not.toBeNull();
    const columnas = bloque![1]!
      .split("\n")
      .filter((l) => /^\s*`[a-z_]+`\s/.test(l)).length;
    expect(columnas).toBe(15);
    const filas = Number(/FILAS_POR_INSERCION = (\d+)/.exec(fuente)?.[1]);
    expect(filas).toBeGreaterThan(0);
    expect(filas * columnas).toBeLessThanOrEqual(100);
    /* Las DOS inserciones de tandas (categorías y bandas) pasan por el ayudante. */
    expect(fuente.match(/await insertarTandas\(/g)?.length).toBe(2);
    expect(fuente).not.toContain(
      "db.insert(tandasImportacionCj).values(\n      tandas",
    );
    expect(fuente).not.toMatch(/slice\(i, i \+ 20\)/);
  });

  it("un arranque que falla a mitad no deja un trabajo fantasma que bloquee el botón", () => {
    expect(fuente).toContain("No se pudieron guardar las categorías");
    /* Tolerante al formato: lo que importa es que el trabajo se borre. */
    expect(fuente).toMatch(
      /db\s*\.delete\(importacionesCj\)\s*\.where\(eq\(importacionesCj\.id,\s*id\)\)/,
    );
    /* Y una viva sin tandas se retira sola al volver a pulsar. */
    expect(fuente).toContain("Number(conTandas?.n ?? 0) === 0");
  });

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
    /* Desde el 2 sep (noche) el afinado, el flete y el refresco de stock
       usan el ritmo CON reintento: mientras la importación le habla a CJ,
       seis de cada ocho afinados chocaban con «too many requests». */
    for (const ruta of [
      "src/lib/cj/afinar.ts",
      "src/lib/cj/flete.ts",
      "src/lib/cj/existencias.ts",
    ]) {
      const codigo = leer(ruta);
      expect(codigo, ruta).toContain("llamarCjConRitmo");
      expect(codigo, ruta).not.toMatch(/\bllamarCj\(/);
    }
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

describe("una venta cobrada nunca se queda sin rastro en Pedidos al proveedor", () => {
  it("todo fallo posterior a cargar el pedido deja su fila con_error (MT-000013, 3 sep 2026)", () => {
    const fuente = readFileSync("src/lib/cj/pedidos.ts", "utf-8");
    const ini = fuente.indexOf("export async function comprarAlProveedor(");
    const fin = fuente.indexOf(".insert(pedidosProveedor)", ini);
    const desde = fuente.indexOf('motivo: "Ese pedido no existe."', ini) + 40;
    const tramo = fuente.slice(desde, fin);
    /* Ninguna salida «a pelo» entre cargar el pedido y crear la fila. */
    expect(tramo).not.toMatch(/return \{\s*ok: false,/);
    expect(
      (tramo.match(/return falloVisible\(db, pedidoId,/g) ?? []).length,
    ).toBeGreaterThanOrEqual(4);
    /* Y el vigilante trae el motivo de la bitácora para lo que no dejó fila. */
    expect(readFileSync("src/lib/vigilante/hechos.ts", "utf-8")).toMatch(
      /like\(\s*bitacoraPagos\.paso,\s*"compra_proveedor%",?\s*\)/,
    );
  });
});
