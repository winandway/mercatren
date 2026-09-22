import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * ══ EL PANEL RESPONDE AL INSTANTE (21 sep 2026) ══
 *
 * Richard: «el menú está muy lento; navego y por ejemplo en Configuración
 * está muy lento». Tres causas, y esta prueba se pone roja si vuelve
 * cualquiera:
 *
 *  1. Sin `loading.tsx`, tocar el menú no hacía NADA hasta que el servidor
 *     terminaba todas las consultas de la pantalla de destino.
 *  2. El layout (corre en cada pantalla) hacía seis viajes a la base uno
 *     detrás de otro, y uno traía la lista ENTERA de pagos pendientes para
 *     leerle `.length`.
 *  3. Configuración hacía catorce viajes seguidos, y cinco traían el
 *     catálogo entero (47.000 filas) al servidor para contar en JavaScript.
 */

const leer = (relativo: string) =>
  readFileSync(join(process.cwd(), relativo), "utf8");
const sinComentarios = (codigo: string) =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

describe("al tocar el menú, la pantalla responde", () => {
  it("el panel tiene su pantalla de carga", () => {
    const cargando = leer("src/app/[locale]/panel/loading.tsx");
    expect(cargando).toContain("export default function Cargando");
    expect(cargando).toContain("animate-pulse");
    /* Sin textos: nada que traducir, nada que esperar. */
    expect(cargando).not.toMatch(/t\(|getTranslations/);
  });
});

describe("el layout del panel hace un solo viaje", () => {
  const layout = sinComentarios(leer("src/app/[locale]/panel/layout.tsx"));

  it("cuenta los pagos pendientes en vez de traer la lista entera", () => {
    expect(layout).toContain("contarPendientesDeValidacion()");
    expect(layout).not.toContain("listarPendientesDeValidacion");
    expect(layout).not.toContain("pendientes.length");
  });

  it("todo lo del layout sale en un solo Promise.all", () => {
    /* El Promise.all que trae los pendientes (el primero es usuario + interno). */
    const inicio = layout.indexOf(
      "] = await Promise.all([",
      layout.indexOf("contarPendientesDeValidacion()") - 400,
    );
    const bloque = layout.slice(inicio, layout.indexOf("]);", inicio));
    for (const pieza of [
      "contarPendientesDeValidacion()",
      "contarRetirosPendientes()",
      "getMessages()",
      "comercioObservado()",
      "mercadoDelPanel()",
      "esSoporteDeVerdad()",
    ]) {
      expect(bloque, pieza).toContain(pieza);
    }
  });

  it("el conteo de pendientes es un COUNT con el mismo filtro que la lista", () => {
    const zelle = sinComentarios(leer("src/lib/zelle/consultas.ts"));
    const conteo = zelle.slice(
      zelle.indexOf("export async function contarPendientesDeValidacion("),
      zelle.indexOf("export async function listarPendientesDeValidacion("),
    );
    expect(conteo).toContain("COUNT(*)");
    expect(conteo).toContain("SOLO_ENTRADAS");
    expect(conteo).toContain('eq(pagosZelle.estado, "pendiente")');
    expect(conteo).toContain("await filtroDeComercio(comercio)");
  });
});

describe("Configuración no trae el catálogo al servidor para contar", () => {
  const traduccion = sinComentarios(leer("src/lib/traduccion/acciones.ts"));
  const envio = sinComentarios(leer("src/lib/destino/recalcular-us.ts"));
  const auditoria = sinComentarios(leer("src/lib/productos/auditoria.ts"));
  const pagina = sinComentarios(
    leer("src/app/[locale]/panel/configuracion/page.tsx"),
  );

  const cuerpo = (codigo: string, nombre: string) => {
    const i = codigo.indexOf(`export async function ${nombre}(`);
    expect(i, nombre).toBeGreaterThan(-1);
    const resto = codigo.slice(i);
    return resto.slice(0, resto.indexOf("\n}\n"));
  };

  it("contarSinTraducir cuenta en SQL con la regla de faltaTraducir", () => {
    const f = cuerpo(traduccion, "contarSinTraducir");
    expect(f).toContain("COUNT(*)");
    expect(f).toContain("FALTA_TRADUCIR_SQL");
    expect(f).not.toContain(".filter(faltaTraducir)");
    /* La regla en SQL dice lo mismo que en código: hay inglés, y el español
       falta o es igual. */
    expect(traduccion).toMatch(
      /FALTA_TRADUCIR_SQL = sql`trim\(coalesce\(\$\{productos\.tituloEn\}, ''\)\) <> ''/,
    );
    expect(traduccion).toContain(
      "lower(trim(${productos.tituloEs})) = lower(trim(${productos.tituloEn}))",
    );
  });

  it("contarSinDescripcion y motivosDeFallo cuentan y agrupan en la base", () => {
    expect(cuerpo(traduccion, "contarSinDescripcion")).toContain("COUNT(*)");
    expect(cuerpo(traduccion, "contarSinDescripcion")).not.toContain(".length");
    const motivos = cuerpo(traduccion, "motivosDeFallo");
    expect(motivos).toContain(".groupBy(");
    expect(motivos).toContain(".limit(6)");
    expect(motivos).not.toContain("new Map");
  });

  it("contarSinEnvio es un COUNT", () => {
    const f = cuerpo(envio, "contarSinEnvio");
    expect(f).toContain("COUNT(*)");
    expect(f).not.toContain("filas.length");
  });

  it("la auditoría y los tres conteos del catálogo se recuerdan cinco minutos", () => {
    /* Medido en producción: el COUNT sigue recorriendo el catálogo
       (500–700 ms). Con el país en la llave; la auditoría no depende de él. */
    expect(cuerpo(auditoria, "auditarPrecios")).toContain(
      'recordadoEnElBorde("auditoria-precios-global", 5 * 60_000',
    );
    expect(cuerpo(traduccion, "contarSinTraducir")).toContain(
      "`sin-traducir-${paisDelCatalogo}`",
    );
    expect(cuerpo(traduccion, "contarSinDescripcion")).toContain(
      "`sin-descripcion-${paisDelCatalogo}`",
    );
    expect(cuerpo(envio, "contarSinEnvio")).toContain(
      "`sin-envio-${plaza.paisEntrega}`",
    );
  });

  it("la pantalla pide todo de una vez, no en fila", () => {
    const desde = pagina.indexOf(
      "export default async function PaginaConfiguracion(",
    );
    const hasta = pagina.indexOf(
      "const { env } = getCloudflareContext();",
      desde,
    );
    const cuerpoPagina = pagina.slice(desde, hasta);
    /* Un solo `await Promise.all` con todas las consultas dentro. */
    const bloque = cuerpoPagina.slice(
      cuerpoPagina.indexOf("] = await Promise.all(["),
    );
    for (const consulta of [
      "auditarPrecios()",
      "contarFotosPendientes()",
      "estadoDelIndice()",
      "estadoDelTraductor()",
      "contarSinDescripcion()",
      "motivosDeFallo()",
      "contarSinEnvio()",
      "saludDeLosComercios()",
      "estadoDeTasasAutomaticas()",
      "resumenF129()",
    ]) {
      expect(bloque, consulta).toContain(consulta);
    }
    /* Y ninguna de ellas queda fuera, como un `await` suelto antes. */
    const antes = cuerpoPagina.slice(
      0,
      cuerpoPagina.indexOf("] = await Promise.all(["),
    );
    expect(antes).not.toMatch(
      /await (auditarPrecios|contarFotosPendientes|estadoDelIndice|estadoDelTraductor|contarSinDescripcion|motivosDeFallo|contarSinEnvio|saludDeLosComercios|estadoZelleCobros|estadoTransferencia|estadoDeTasasAutomaticas|resumenF129)\(/,
    );
  });
});
