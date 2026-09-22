import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ciudadPlausibleUS } from "@/lib/destino/direccion";
import { z } from "zod";

import {
  comprarDeVerdadACjNucleo,
  leerUltimaCompraDePruebaNucleo,
  pagarUltimaPruebaPendienteNucleo,
  probarCompraDeCjNucleo,
  saldoDeCj,
  sondaCj,
} from "@/lib/cj/probar-compra-nucleo";
import { autorizadoPorLlave } from "@/lib/seguridad/llave-del-reloj";

/**
 * LA PUERTA PARA PROBAR LA COMPRA A CJ SIN SESIÓN (5 sep 2026).
 *
 * Palabras del dueño: «el de pruebas debería tomar el control de ese botón y
 * tú directamente hacer pruebas hasta que esa mierda funcione. ¿Qué me pones
 * a mí a perder el tiempo aquí en esto?». Tenía razón: cada intento era él
 * pulsando un botón y mandando una captura.
 *
 * Esta puerta hace LO MISMO que los botones de Panel → Probar una compra,
 * pero la dispara el flujo `probar-compra.yml` de GitHub con la llave del
 * reloj (`SINCRONIZAR_LLAVE`, la misma de `/datos/vigilante`), y devuelve
 * el diagnóstico entero —cada paso con lo que CJ contestó— en la respuesta.
 * Así se repite la prueba las veces que haga falta sin que nadie toque nada,
 * y solo cuando sale en verde se le pide a él la compra real.
 *
 * Sin llave cargada, 503 y no hace nada; a quien no la trae, 404. Todo lo
 * que entra pasa por zod. La sonda (`accion: "cj"`) solo deja rutas de CJ
 * de la lista de `rutaDeSondaPermitida`.
 */
export const dynamic = "force-dynamic";

const Direccion = z.object({
  nombre: z.string().min(1),
  direccion: z.string().min(1),
  direccion2: z.string().optional(),
  /* «MI» no es una ciudad: es el estado escrito en la casilla equivocada,
     y CJ para el pedido a preguntar. Ver `ciudadPlausibleUS`. */
  ciudad: z.string().min(1).refine(ciudadPlausibleUS, {
    message: "la ciudad parece un estado: escribe la ciudad (Novi, no MI)",
  }),
  estado: z.string().min(1),
  codigoPostal: z.string().default(""),
  telefono: z.string().optional(),
});

const Peticion = z.discriminatedUnion("accion", [
  z.object({ accion: z.literal("saldo") }),
  z.object({ accion: z.literal("ultima") }),
  /* Rehace la foto de conteos del catálogo de los cuatro mercados y la
     devuelve resumida (emergencia de costo, 17 sep 2026). Solo lectura del
     catálogo; escribe una fila por mercado en `configuracion`. */
  z.object({ accion: z.literal("conteos") }),
  /* Prepara el texto de búsqueda de los productos pendientes (20 sep 2026) y
     dice cuántas filas hay y si el buscador ya las usa. Solo escribe en
     `texto_de_busqueda` y su marca en `configuracion`. */
  z.object({ accion: z.literal("texto-de-busqueda") }),
  /* Cronometra las consultas del layout del panel y de Configuración (21 sep
     2026): el panel exige sesión y desde fuera no se puede medir. Solo lee. */
  z.object({ accion: z.literal("medir-panel") }),
  /* Qué banco y qué titular ve quien paga por transferencia. Sin números:
     solo los cuatro últimos dígitos (21 sep 2026). */
  z.object({ accion: z.literal("banco-del-cobro") }),
  /* Los diez últimos cobros con su enlace, sin filtros y sin tragarse el
     error (21 sep 2026). */
  z.object({ accion: z.literal("ultimos-cobros") }),
  /* Las estadísticas de la base (18 sep 2026): enseña el plan de las
     consultas-trampa, corre ANALYZE (o `PRAGMA optimize`) y lo enseña otra
     vez. Sin estadísticas SQLite elegía el índice de `estado` en todas
     partes. Solo escribe `sqlite_stat1`: ningún dato. */
  z.object({
    accion: z.literal("optimizar"),
    modo: z.enum(["analyze", "optimize", "solo-plan"]).default("analyze"),
  }),
  z.object({
    accion: z.literal("mirar"),
    enlace: z.string().min(1),
    estado: z.string().optional(),
    codigoPostal: z.string().optional(),
  }),
  z.object({
    accion: z.literal("comprar"),
    enlace: z.string().min(1),
    direccion: Direccion,
  }),
  z.object({ accion: z.literal("pagar") }),
  z.object({ accion: z.literal("priorizar"), enlace: z.string().min(1) }),
  z.object({ accion: z.literal("describir"), enlace: z.string().min(1) }),
  z.object({
    accion: z.literal("publicar"),
    enlace: z.string().min(1),
    fleteCentavos: z.number().int().min(1).max(50_000),
  }),
  z.object({
    accion: z.literal("agregar"),
    pid: z.string().min(5),
    mercados: z
      .array(z.enum(["US", "CL", "CO"]))
      .min(1)
      .max(3),
  }),
  /* Las tarifas del casillero, desde la puerta (16 sep 2026): Richard pidió
     que las cargara yo con lo que contestó el agente de carga. En dólares y
     por ciento, como las da el agente; mismos cerrojos que el formulario. */
  z.object({
    accion: z.literal("tarifa"),
    pais: z.string().regex(/^[A-Z]{2}$/),
    /* aereo (por libra) o maritimo (por pie cúbico; el peso no aplica). */
    modo: z.enum(["aereo", "maritimo"]).default("aereo"),
    tarifaPie: z.number().min(0).max(500).default(0),
    minimoPies: z.number().min(0).max(100).default(1),
    tarifaLibra: z.number().min(0).max(100).default(0),
    minimoLb: z.number().min(0).max(100).default(1),
    minimoCobro: z.number().min(0).max(1000).default(0),
    despacho: z.number().min(0).max(500).default(0),
    seguroPorciento: z.number().min(0).max(20).default(0),
    seguroDesde: z.number().min(0).max(100_000).default(0),
    divisor: z.number().int().min(100).max(300).default(166),
    diasGratis: z.number().int().min(0).max(365).default(30),
    almacenajeDia: z.number().min(0).max(100).default(0),
    impuestoIncluido: z.boolean().default(false),
    activa: z.boolean().default(false),
    nota: z.string().max(500).optional(),
  }),
  z.object({
    accion: z.literal("cotizar"),
    pais: z.string().regex(/^[A-Z]{2}$/),
    modo: z.enum(["aereo", "maritimo"]).default("aereo"),
    unidad: z.enum(["lb", "kg"]).default("lb"),
    conSeguro: z.boolean().optional(),
    pesoLb: z.number().min(0).max(500).default(0),
    largoIn: z.number().min(0).max(200).optional(),
    anchoIn: z.number().min(0).max(200).optional(),
    altoIn: z.number().min(0).max(200).optional(),
    valorUsd: z.number().min(0).max(100_000).optional(),
    diasEnBodega: z.number().int().min(0).max(365).optional(),
  }),
  z.object({
    accion: z.literal("cj"),
    ruta: z.string().min(1).max(500),
    metodo: z.enum(["GET", "POST", "PATCH", "DELETE"]).optional(),
    cuerpo: z.unknown().optional(),
  }),
]);

export async function POST(peticion: Request) {
  const { env } = getCloudflareContext();
  const permiso = autorizadoPorLlave(peticion, env.SINCRONIZAR_LLAVE);
  if (permiso === "sin_llave") {
    return Response.json(
      { ok: false, motivo: "Falta SINCRONIZAR_LLAVE." },
      { status: 503 },
    );
  }
  if (permiso === "no") return Response.json({ ok: false }, { status: 404 });

  const crudo = await peticion.json().catch(() => null);
  const entrada = Peticion.safeParse(crudo);
  if (!entrada.success) {
    return Response.json(
      { ok: false, motivo: "Cuerpo inválido.", detalle: entrada.error.issues },
      { status: 400 },
    );
  }

  const e = entrada.data;
  const empezo = Date.now();
  let resultado: unknown;
  switch (e.accion) {
    case "saldo":
      resultado = await saldoDeCj();
      break;
    case "ultima":
      resultado = await leerUltimaCompraDePruebaNucleo();
      break;
    case "optimizar": {
      const { sql: crudo } = await import("drizzle-orm");
      const { getDb } = await import("@/lib/db");
      const db = getDb();
      const PLANES: Record<string, string> = {
        "por ids con estado":
          "EXPLAIN QUERY PLAN SELECT p.id FROM productos p JOIN tiendas t ON t.id = p.tienda_id WHERE p.id IN ('a','b','c') AND p.estado = 'publicado' AND t.mercado = 'US' AND t.estado = 'activa'",
        "similares por categoría":
          "EXPLAIN QUERY PLAN SELECT p.id FROM productos p JOIN tiendas t ON t.id = p.tienda_id WHERE t.mercado = 'US' AND p.estado = 'publicado' AND t.estado = 'activa' AND p.precio_centavos > 0 AND p.categoria_id = 'x' ORDER BY p.creado_en DESC LIMIT 10",
        "tienda (resto)":
          "EXPLAIN QUERY PLAN SELECT p.id FROM productos p JOIN tiendas t ON t.id = p.tienda_id WHERE p.tienda_id = 'x' AND t.mercado = 'US' AND p.estado = 'publicado' AND t.estado = 'activa' AND +p.creado_en <= 1 ORDER BY p.actualizado_en DESC LIMIT 24",
      };
      const planes = async () => {
        const salida: Record<string, string[]> = {};
        for (const [nombre, consulta] of Object.entries(PLANES)) {
          try {
            const filas = await db.all<{ detail: string }>(crudo.raw(consulta));
            salida[nombre] = filas.map((f) => f.detail);
          } catch (fallo) {
            salida[nombre] = [
              `error: ${fallo instanceof Error ? fallo.message : String(fallo)}`,
            ];
          }
        }
        return salida;
      };
      const estadisticas = async () => {
        try {
          const [f] = await db.all<{ n: number }>(
            crudo.raw("SELECT count(*) AS n FROM sqlite_stat1"),
          );
          return Number(f?.n ?? 0);
        } catch (fallo) {
          return `no se pudo leer: ${fallo instanceof Error ? fallo.message : String(fallo)}`;
        }
      };
      const antes = {
        estadisticas: await estadisticas(),
        planes: await planes(),
      };
      let corrio: string = "nada (solo-plan)";
      if (e.modo !== "solo-plan") {
        const orden =
          e.modo === "analyze" ? "ANALYZE" : "PRAGMA optimize=0x10002";
        const t0 = Date.now();
        try {
          await db.run(crudo.raw(orden));
          corrio = `${orden}: ok en ${Date.now() - t0} ms`;
        } catch (fallo) {
          corrio = `${orden}: error ${fallo instanceof Error ? fallo.message : String(fallo)}`;
        }
      }
      const despues = {
        estadisticas: await estadisticas(),
        planes: await planes(),
      };
      resultado = { corrio, antes, despues };
      break;
    }
    case "ultimos-cobros": {
      const { ultimosCobros } = await import("@/lib/salud/medir-panel");
      resultado = await ultimosCobros();
      break;
    }
    case "banco-del-cobro": {
      const { queBancoVeElCliente } = await import("@/lib/salud/medir-panel");
      resultado = await queBancoVeElCliente();
      break;
    }
    case "medir-panel": {
      const { medirElPanel } = await import("@/lib/salud/medir-panel");
      resultado = await medirElPanel();
      break;
    }
    case "texto-de-busqueda": {
      const { ponerAlDiaElTextoDeBusqueda, estadoDelTextoDeBusqueda } =
        await import("@/lib/catalogo/texto-de-busqueda");
      const hasta = Date.now() + 22_000;
      const hecho = await ponerAlDiaElTextoDeBusqueda(() => hasta - Date.now());
      resultado = { ...hecho, ...(await estadoDelTextoDeBusqueda()) };
      break;
    }
    case "conteos": {
      const { recalcularTodosLosConteos, edadDeLosConteos, conteosGuardados } =
        await import("@/lib/catalogo/conteos");
      const { MERCADOS } = await import("@/lib/mercado/mercados");
      const r = await recalcularTodosLosConteos();
      const { recalcularTodosLosListados } =
        await import("@/lib/catalogo/consultas");
      const listados = await recalcularTodosLosListados();
      const edad = await edadDeLosConteos();
      const resumen: Record<string, unknown> = {};
      for (const m of MERCADOS) {
        const c = await conteosGuardados(m);
        resumen[m.codigo] = c
          ? {
              total: c.total,
              departamentos: Object.values(c.departamentos).filter((n) => n > 0)
                .length,
              categorias: c.categorias.length,
              comercios: c.comercios.length,
              cobertura: Object.keys(c.cobertura).length,
              bytes: JSON.stringify(c).length,
            }
          : null;
      }
      resultado = { ...r, listados, edadMinutos: edad.minutos, resumen };
      break;
    }
    case "mirar":
      resultado = await probarCompraDeCjNucleo({
        enlace: e.enlace,
        estado: e.estado,
        codigoPostal: e.codigoPostal,
      });
      break;
    case "comprar":
      resultado = await comprarDeVerdadACjNucleo(
        { enlace: e.enlace, direccion: e.direccion },
        "puerta de pruebas (GitHub)",
      );
      break;
    case "pagar":
      resultado = await pagarUltimaPruebaPendienteNucleo();
      break;
    case "describir": {
      const { describirUnProducto } = await import("@/lib/cj/describir-uno");
      resultado = await describirUnProducto(e.enlace);
      break;
    }
    case "publicar": {
      const { publicarConFleteManual } =
        await import("@/lib/cj/publicar-manual");
      resultado = await publicarConFleteManual(e.enlace, e.fleteCentavos);
      break;
    }
    case "priorizar": {
      const { priorizarPorEnlace } =
        await import("@/lib/cj/probar-compra-nucleo");
      resultado = await priorizarPorEnlace(e.enlace);
      break;
    }
    case "agregar": {
      /* Una plaza tras otra, nunca a la vez: las tres le hablan al mismo CJ
         de una llamada por segundo. */
      const { agregarPorPid } = await import("@/lib/cj/agregar-por-pid");
      const salidas = [];
      for (const mercado of e.mercados) {
        salidas.push(await agregarPorPid(e.pid, mercado));
      }
      resultado = salidas;
      break;
    }
    case "tarifa": {
      if (e.modo === "maritimo") {
        if (e.activa && e.tarifaPie <= 0) {
          resultado = {
            ok: false,
            motivo: "No se enciende una tarifa marítima sin precio por pie.",
          };
          break;
        }
        const { guardarTarifaMaritimaFila } =
          await import("@/lib/casillero/tarifas-guardar");
        const cm = (d: number) => Math.round(d * 100);
        await guardarTarifaMaritimaFila(
          {
            pais: e.pais,
            tarifaPieCentavos: cm(e.tarifaPie),
            minimoPies: e.minimoPies,
            minimoCobroCentavos: cm(e.minimoCobro),
            seguroPuntosBase: Math.round(e.seguroPorciento * 100),
            seguroDesdeCentavos: cm(e.seguroDesde),
            impuestoIncluido: e.impuestoIncluido,
            activa: e.activa,
            nota: e.nota?.trim() || null,
          },
          "puerta de pruebas (GitHub)",
        );
        const { tarifaMaritimaDe } = await import("@/lib/casillero/tarifas");
        resultado = { ok: true, guardada: await tarifaMaritimaDe(e.pais) };
        break;
      }
      if (e.activa && e.tarifaLibra <= 0) {
        resultado = {
          ok: false,
          motivo: "No se enciende una tarifa sin precio.",
        };
        break;
      }
      const { guardarTarifaFila } =
        await import("@/lib/casillero/tarifas-guardar");
      const c = (d: number) => Math.round(d * 100);
      await guardarTarifaFila(
        {
          pais: e.pais,
          tarifaLibraCentavos: c(e.tarifaLibra),
          minimoLb: e.minimoLb,
          minimoCobroCentavos: c(e.minimoCobro),
          despachoCentavos: c(e.despacho),
          seguroPuntosBase: Math.round(e.seguroPorciento * 100),
          seguroDesdeCentavos: c(e.seguroDesde),
          divisorVolumetrico: e.divisor,
          diasAlmacenajeGratis: e.diasGratis,
          almacenajeDiaCentavos: c(e.almacenajeDia),
          impuestoIncluido: e.impuestoIncluido,
          activa: e.activa,
          nota: e.nota?.trim() || null,
        },
        "puerta de pruebas (GitHub)",
      );
      const { tarifaDe } = await import("@/lib/casillero/tarifas");
      resultado = { ok: true, guardada: await tarifaDe(e.pais) };
      break;
    }
    case "cotizar": {
      const { tarifaDe, tarifaMaritimaDe } =
        await import("@/lib/casillero/tarifas");
      const { aLibras, cotizarEnvio, cotizarEnvioMaritimo } =
        await import("@/lib/casillero/cotizar");
      const medidas =
        e.largoIn && e.anchoIn && e.altoIn
          ? { largoIn: e.largoIn, anchoIn: e.anchoIn, altoIn: e.altoIn }
          : null;
      const valorDeclaradoCentavos =
        e.valorUsd !== undefined ? Math.round(e.valorUsd * 100) : null;
      if (e.modo === "maritimo") {
        const tarifa = await tarifaMaritimaDe(e.pais);
        resultado = {
          tarifa,
          cotizacion: cotizarEnvioMaritimo(
            { medidas, valorDeclaradoCentavos, conSeguro: e.conSeguro },
            tarifa,
          ),
        };
        break;
      }
      const tarifa = await tarifaDe(e.pais);
      resultado = {
        tarifa,
        cotizacion: cotizarEnvio(
          {
            pesoRealLb: aLibras(e.pesoLb, e.unidad),
            medidas,
            valorDeclaradoCentavos,
            conSeguro: e.conSeguro,
            diasEnBodega: e.diasEnBodega,
          },
          tarifa,
        ),
      };
      break;
    }
    case "cj":
      resultado = await sondaCj({
        ruta: e.ruta,
        metodo: e.metodo,
        cuerpo: e.cuerpo,
      });
      break;
  }

  return Response.json({
    ok: true,
    accion: e.accion,
    duracionMs: Date.now() - empezo,
    resultado,
  });
}
