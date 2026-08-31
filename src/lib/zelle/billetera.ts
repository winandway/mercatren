import "server-only";

import { and, desc, eq, exists, gte, like, or, sql } from "drizzle-orm";

import { obtenerAlcance } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import {
  billeteras,
  cobrosSolicitados,
  itemsPedido,
  movimientosBilletera,
  pagos,
  pedidos as tablaPedidos,
  pagosZelle,
  retiros,
  retirosFee,
  tiendas,
} from "@/lib/db/schema";

/**
 * La billetera del comercio, con su posición REAL.
 *
 * DE DÓNDE SALE EL SALDO (y por qué no es un número guardado a mano):
 *
 *   entradas aprobadas − comisión = neto del comercio
 *   neto − retiros ya hechos      = lo que todavía tiene a su favor
 *
 * Con el histórico del piloto eso da exactamente los $24,283.75 que el
 * comercio ve en el sistema anterior. Se calcula en vez de guardarse porque un
 * número escrito a mano se desactualiza en cuanto se aprueba el siguiente pago
 * y nadie se entera; calculado, no puede mentir.
 *
 * OJO CON LA REGLA DE LOS RETIROS: en los totales del NEGOCIO (ingresos,
 * comisión) los retiros no se suman nunca — eso sigue igual. Pero el saldo de
 * una billetera es justo lo contrario: es lo que queda DESPUÉS de restarlos.
 * Son dos preguntas distintas sobre los mismos datos.
 *
 * Ese dinero no está en una cuenta aparte: está en la cuenta del banco, a
 * favor del comercio, esperando a que lo pida.
 */

const ENTRADA_APROBADA = and(
  eq(pagosZelle.tipo, "entrada"),
  eq(pagosZelle.estado, "aprobado"),
);

const RETIRO_APROBADO = and(
  eq(pagosZelle.tipo, "retiro"),
  eq(pagosZelle.estado, "aprobado"),
);

/** Primer día del mes en curso. */
function inicioDelMes(): Date {
  const hoy = new Date();
  return new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
}

/**
 * Un `MAX()` sobre una columna de tiempo llega en segundos, no como fecha:
 * Drizzle solo la convierte cuando se pide la columna tal cual.
 */
function fechaEnMilisegundos(valor: number | null): number | null {
  return valor ? Number(valor) * 1000 : null;
}

/** La más reciente de dos fechas, aguantando que falte cualquiera de las dos. */
function ultimaFecha(...fechas: (number | null)[]): number | null {
  const conValor = fechas.filter((f): f is number => f !== null);
  return conValor.length > 0 ? Math.max(...conValor) : null;
}

/**
 * Qué tienda toca.
 *
 * Un vendedor: la suya, pase lo que pase. El equipo: la que pida por la
 * dirección —por slug o por id, que en la práctica llegan las dos— y si no
 * pide ninguna, la primera que haya. Antes, sin parámetro, la pantalla decía
 * "este comercio todavía no tiene billetera abierta" aunque sí la tuviera.
 */
async function tiendaAConsultar(comercio?: string): Promise<string | null> {
  const alcance = await obtenerAlcance();
  if (alcance.tipo === "tienda") return alcance.tiendaId;

  const db = getDb();

  if (comercio) {
    const [fila] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(or(eq(tiendas.slug, comercio), eq(tiendas.id, comercio)))
      .limit(1);
    if (fila) return fila.id;
  }

  const [primera] = await db
    .select({ id: billeteras.tiendaId })
    .from(billeteras)
    .limit(1);

  return primera?.id ?? null;
}

export type PosicionBilletera = {
  tiendaId: string;
  nombreTienda: string;
  moneda: string;
  proveedor: string;
  /** Lo que el comercio tiene a su favor ahora mismo. */
  saldoCentavos: number;
  /**
   * Lo que ya pidió y todavía no le hemos mandado.
   *
   * Está apartado a propósito: mientras esté aquí no se puede volver a pedir.
   */
  enTramiteCentavos: number;
  /** Lo que puede pedir hoy: el saldo menos lo que ya está en trámite. */
  disponibleCentavos: number;
  /** Todo lo que se le ha acreditado desde el principio. */
  netoHistoricoCentavos: number;
  /** Todo lo que ya se llevó. */
  retiradoCentavos: number;
  /** Cuántas veces ha retirado. */
  retiros: number;
  /** Lo recibido de otros comercios de Mercatren, ya pagado. */
  recibidoDeOtrosCentavos: number;
  mes: {
    brutoCentavos: number;
    comisionCentavos: number;
    retiradoCentavos: number;
    rechazadoCentavos: number;
  };
  /** Lo que Mercatren se ha ganado con este comercio. */
  comisionGanadaCentavos: number;
  /**
   * Lo cobrado por cada vía, en bruto. Hace falta para poder enseñarle al
   * comercio **cuánto se llevó el procesador y cuánto Mercatren, por
   * separado**: por Zelle no interviene ningún procesador, así que sin saber
   * qué parte entró por dónde el desglose sería un invento.
   */
  brutoTarjetaCentavos: number;
  brutoZelleCentavos: number;
  /**
   * Hasta qué día llegan los datos que tenemos.
   *
   * Hace falta a la vista: el histórico se trajo de una exportación con fecha,
   * así que si el mes en curso sale en cero puede ser que no hubo ventas... o
   * que los datos se quedaron atrás. Sin este dato, un cero se lee mal.
   */
  ultimoMovimiento: number | null;
};

/**
 * LAS VENTAS COBRADAS CON TARJETA, que también son dinero del comercio.
 *
 * ══ EL FALLO QUE ARREGLA (10 ago 2026) ══
 *
 * La billetera calculaba el saldo leyendo SOLO `pagos_zelle` y `retiros`. Una
 * venta cobrada con tarjeta se acreditaba bien en la base, pero la pantalla la
 * ignoraba: el comercio entraba a su billetera y veía **$0.00 y cero
 * movimientos** teniendo dinero suyo esperando.
 *
 * Pasó con la primera venta real con tarjeta (Inversiones Multiservicios,
 * MT-000002). Un comercio al que no le aparece lo que vendió da por hecho que
 * no le pagamos, y con razón.
 *
 * ══ POR QUÉ SE CALCULA Y NO SE LEE DE `movimientos_billetera` ══
 *
 * Por lo mismo que el resto de esta pantalla: un número guardado se
 * desactualiza y nadie se entera. Y hay una razón de más — la aprobación de un
 * Zelle TAMBIÉN escribe en `movimientos_billetera`, así que sumar esa tabla
 * contaría los pagos de Zelle dos veces. `pagos` y `pagos_zelle` son tablas
 * distintas y sin solape: por ahí no se puede contar nada dos veces.
 *
 * ══ POR QUÉ `exists` Y NO UN JOIN ══
 *
 * Con un `innerJoin` contra `pagos`, un pedido con dos filas de cobro
 * confirmadas duplicaría cada renglón y el comercio vería el doble de lo que
 * vendió. `exists` pregunta si está cobrado sin multiplicar nada.
 */
function cobradoConTarjeta(db: ReturnType<typeof getDb>) {
  return exists(
    db
      .select({ hay: sql`1` })
      .from(pagos)
      .where(
        and(
          eq(pagos.pedidoId, itemsPedido.pedidoId),
          eq(pagos.metodo, "stripe"),
          eq(pagos.estado, "confirmado"),
        ),
      ),
  );
}

export async function obtenerPosicion(
  comercio?: string,
): Promise<PosicionBilletera | null> {
  const tiendaId = await tiendaAConsultar(comercio);
  if (!tiendaId) return null;

  const db = getDb();

  const [tienda] = await db
    .select({ nombre: tiendas.nombre })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  if (!tienda) return null;

  const [datos] = await db
    .select({
      esMiTienda: sql<number>`1`,
      netoHistorico: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.netoCentavos} ELSE 0 END), 0)`,
      comisionGanada: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.comisionCentavos} ELSE 0 END), 0)`,
      retirado: sql<number>`COALESCE(SUM(CASE WHEN ${RETIRO_APROBADO} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      retiros: sql<number>`COALESCE(SUM(CASE WHEN ${RETIRO_APROBADO} THEN 1 ELSE 0 END), 0)`,
      ultimo: sql<number | null>`MAX(${pagosZelle.fechaTransaccion})`,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.tiendaId, tiendaId));

  /**
   * El mes se agrupa por la fecha en que se APROBÓ el pago, no por la fecha
   * en que el pagador hizo la transferencia. Es lo correcto y además es como
   * lo cuenta el sistema de origen: un pago transferido el 31 y aprobado el 1
   * pertenece al mes en que entró el dinero de verdad. Comprobado — así da
   * exactamente sus cifras de agosto.
   */
  const desde = inicioDelMes();
  const enElMes = gte(pagosZelle.aprobadoEn, desde);

  const [mes] = await db
    .select({
      bruto: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      comision: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.comisionCentavos} ELSE 0 END), 0)`,
      retirado: sql<number>`COALESCE(SUM(CASE WHEN ${RETIRO_APROBADO} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
      rechazado: sql<number>`COALESCE(SUM(CASE WHEN ${pagosZelle.estado} = 'rechazado' THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
    })
    .from(pagosZelle)
    .where(and(eq(pagosZelle.tiendaId, tiendaId), enElMes));

  /* Lo cobrado con tarjeta, que hasta el 10 ago 2026 esta pantalla no veía.
     El neto sale de la comisión GUARDADA en el renglón, la misma que usa la
     orden de compra: así los dos documentos dicen el mismo número. */
  const [tarjeta] = await db
    .select({
      bruto: sql<number>`COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0)`,
      comision: sql<number>`COALESCE(SUM(${itemsPedido.comisionCentavos}), 0)`,
      ultimo: sql<number | null>`MAX(${tablaPedidos.actualizadoEn})`,
    })
    .from(itemsPedido)
    .innerJoin(tablaPedidos, eq(tablaPedidos.id, itemsPedido.pedidoId))
    .where(and(eq(itemsPedido.tiendaId, tiendaId), cobradoConTarjeta(db)));

  const [tarjetaDelMes] = await db
    .select({
      bruto: sql<number>`COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0)`,
      comision: sql<number>`COALESCE(SUM(${itemsPedido.comisionCentavos}), 0)`,
    })
    .from(itemsPedido)
    .innerJoin(tablaPedidos, eq(tablaPedidos.id, itemsPedido.pedidoId))
    .where(
      and(
        eq(itemsPedido.tiendaId, tiendaId),
        gte(tablaPedidos.actualizadoEn, desde),
        cobradoConTarjeta(db),
      ),
    );

  /**
   * LOS COBROS POR ENLACE, que también son dinero del comercio.
   *
   * ══ EL FALLO QUE ARREGLA (15 ago 2026) ══
   *
   * La cajera cobra por enlace, el pago entra por Stripe, se acredita el
   * movimiento… y esta pantalla no lo sumaba: el comercio cobraba y su
   * «disponible para retirar» no subía un centavo. Es el mismo fallo que ya
   * pasó con la primera venta con tarjeta (MT-000002), en otra puerta.
   *
   * ══ EL NETO SALE DEL MOVIMIENTO, NO DE RECALCULAR ══
   *
   * El join va contra el movimiento que escribió la acreditación
   * (`referencia = pago_id`), que guarda el neto EXACTO de ese día. Recalcular
   * con la comisión de hoy reescribiría el pasado: el margen va a subir por
   * tramos, y un cobro viejo debe seguir diciendo lo que se acreditó.
   *
   * No cuenta Zelle dos veces: los movimientos de Zelle llevan otra
   * referencia, y el join solo empata los `pi_…` de los cobros de ESTA tienda.
   */
  const COBRO_PAGADO = and(
    eq(cobrosSolicitados.tiendaId, tiendaId),
    eq(cobrosSolicitados.estado, "pagado"),
  );

  const [enlaces] = await db
    .select({
      bruto: sql<number>`COALESCE(SUM(${cobrosSolicitados.montoCentavos}), 0)`,
      neto: sql<number>`COALESCE(SUM(${movimientosBilletera.montoCentavos}), 0)`,
      ultimo: sql<number | null>`MAX(${cobrosSolicitados.pagadoEn})`,
    })
    .from(cobrosSolicitados)
    .innerJoin(
      movimientosBilletera,
      and(
        eq(movimientosBilletera.referencia, cobrosSolicitados.pagoId),
        /* SOLO la acreditación con TARJETA. Un cobro pagado por Zelle ya suma
           por el camino de Zelle (pagos_zelle): su movimiento lleva otra nota,
           y contarlo aquí también sería dinero dos veces. */
        like(movimientosBilletera.nota, "Cobro por enlace%"),
      ),
    )
    .where(COBRO_PAGADO);

  const [enlacesDelMes] = await db
    .select({
      bruto: sql<number>`COALESCE(SUM(${cobrosSolicitados.montoCentavos}), 0)`,
      neto: sql<number>`COALESCE(SUM(${movimientosBilletera.montoCentavos}), 0)`,
    })
    .from(cobrosSolicitados)
    .innerJoin(
      movimientosBilletera,
      and(
        eq(movimientosBilletera.referencia, cobrosSolicitados.pagoId),
        /* SOLO la acreditación con TARJETA. Un cobro pagado por Zelle ya suma
           por el camino de Zelle (pagos_zelle): su movimiento lleva otra nota,
           y contarlo aquí también sería dinero dos veces. */
        like(movimientosBilletera.nota, "Cobro por enlace%"),
      ),
    )
    .where(and(COBRO_PAGADO, gte(cobrosSolicitados.pagadoEn, desde)));

  const [billetera] = await db
    .select({ moneda: billeteras.moneda, proveedor: billeteras.proveedor })
    .from(billeteras)
    .where(eq(billeteras.tiendaId, tiendaId))
    .limit(1);

  /**
   * Los retiros salen de DOS sitios y no se pisan:
   *
   * - los del histórico, que llegaron dentro de `pagos_zelle` y están
   *   congelados,
   * - y los que se piden desde aquí, que viven en `retiros`.
   *
   * Los que están pedidos y aún no se han hecho no bajan el saldo —todavía es
   * suyo— pero sí se apartan, para que no pueda pedir dos veces lo mismo.
   */
  const [pedidos] = await db
    .select({
      pagado: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'pagado' THEN ${retiros.montoCentavos} ELSE 0 END), 0)`,
      enTramite: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'solicitado' THEN ${retiros.montoCentavos} ELSE 0 END), 0)`,
      veces: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'pagado' THEN 1 ELSE 0 END), 0)`,
    })
    .from(retiros)
    .where(eq(retiros.tiendaId, tiendaId));

  /**
   * ══ LA QUINTA FUENTE: LO RECIBIDO DE OTRO COMERCIO (31 ago 2026) ══
   *
   * El retiro «a otro comercio de Mercatren» existía completo por el lado
   * del que ENVÍA, y al pagarse solo se sumaba a un espejo que ninguna
   * pantalla lee — el que RECIBÍA no veía un centavo ni podía retirarlo.
   * La transferencia entra aquí, calculada de los hechos como todo lo
   * demás: los retiros PAGADOS cuyo destino es esta tienda. Sin comisión:
   * es dinero ya neto que solo cambió de bolsillo dentro del sistema.
   */
  const [recibido] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CASE WHEN ${retiros.estado} = 'pagado' THEN ${retiros.montoCentavos} ELSE 0 END), 0)`,
      ultimo: sql<
        number | null
      >`MAX(CASE WHEN ${retiros.estado} = 'pagado' THEN ${retiros.resueltoEn} ELSE NULL END)`,
    })
    .from(retiros)
    .where(
      and(eq(retiros.destinoTiendaId, tiendaId), eq(retiros.forma, "comercio")),
    );

  /* Lo cobrado por Zelle en bruto, para el desglose de arriba. El neto ya se
     calcula aparte; aquí hace falta el bruto, que es sobre lo que se aplican
     los porcentajes. */
  const [brutoZelle] = await db
    .select({
      total: sql<number>`COALESCE(SUM(CASE WHEN ${ENTRADA_APROBADA} THEN ${pagosZelle.montoCentavos} ELSE 0 END), 0)`,
    })
    .from(pagosZelle)
    .where(eq(pagosZelle.tiendaId, tiendaId));

  const netoTarjeta =
    Number(tarjeta?.bruto ?? 0) - Number(tarjeta?.comision ?? 0);
  const netoEnlaces = Number(enlaces?.neto ?? 0);
  const comisionEnlaces = Number(enlaces?.bruto ?? 0) - netoEnlaces;

  const neto =
    Number(datos?.netoHistorico ?? 0) +
    netoTarjeta +
    netoEnlaces +
    Number(recibido?.total ?? 0);
  const retirado = Number(datos?.retirado ?? 0) + Number(pedidos?.pagado ?? 0);
  const enTramite = Number(pedidos?.enTramite ?? 0);
  const saldo = neto - retirado;

  return {
    tiendaId,
    nombreTienda: tienda.nombre,
    moneda: billetera?.moneda ?? "USD",
    proveedor: billetera?.proveedor ?? "tokiia",
    saldoCentavos: saldo,
    enTramiteCentavos: enTramite,
    // Nunca por debajo de cero: si algo cuadrara mal, que no invite a pedir
    // dinero que no hay.
    disponibleCentavos: Math.max(0, saldo - enTramite),
    netoHistoricoCentavos: neto,
    retiradoCentavos: retirado,
    retiros: Number(datos?.retiros ?? 0) + Number(pedidos?.veces ?? 0),
    mes: {
      brutoCentavos:
        Number(mes?.bruto ?? 0) +
        Number(tarjetaDelMes?.bruto ?? 0) +
        Number(enlacesDelMes?.bruto ?? 0),
      comisionCentavos:
        Number(mes?.comision ?? 0) +
        Number(tarjetaDelMes?.comision ?? 0) +
        (Number(enlacesDelMes?.bruto ?? 0) - Number(enlacesDelMes?.neto ?? 0)),
      retiradoCentavos: Number(mes?.retirado ?? 0),
      rechazadoCentavos: Number(mes?.rechazado ?? 0),
    },
    comisionGanadaCentavos:
      Number(datos?.comisionGanada ?? 0) +
      Number(tarjeta?.comision ?? 0) +
      comisionEnlaces,
    /* Los cobros por enlace entran aquí: también son ventas con tarjeta, y el
       desglose de los dos fees del retiro se calcula sobre este bruto. */
    brutoTarjetaCentavos:
      Number(tarjeta?.bruto ?? 0) + Number(enlaces?.bruto ?? 0),
    brutoZelleCentavos: Number(brutoZelle?.total ?? 0),
    recibidoDeOtrosCentavos: Number(recibido?.total ?? 0),
    ultimoMovimiento: ultimaFecha(
      datos?.ultimo ? Number(datos.ultimo) * 1000 : null,
      fechaEnMilisegundos(tarjeta?.ultimo ?? null),
      fechaEnMilisegundos(enlaces?.ultimo ?? null),
      fechaEnMilisegundos(recibido?.ultimo ?? null),
    ),
  };
}

export type MovimientoBilletera = {
  id: string;
  fecha: number | null;
  tipo: "entrada" | "retiro";
  concepto: string | null;
  montoCentavos: number;
  saldoResultanteCentavos: number;
};

/**
 * El historial de la billetera, armado con los pagos reales.
 *
 * Cada entrada aprobada suma su neto y cada retiro resta su monto, así que la
 * columna de saldo cuadra con el número de arriba. Se calcula hacia atrás
 * desde el saldo actual: el movimiento más nuevo deja el saldo de hoy.
 */
export async function listarMovimientosReales(
  comercio?: string,
  limite = 60,
): Promise<MovimientoBilletera[]> {
  const posicion = await obtenerPosicion(comercio);
  if (!posicion) return [];

  const db = getDb();

  const [filas, salidas, conTarjeta, porEnlace, recibidas] = await Promise.all([
    db
      .select({
        id: pagosZelle.id,
        fecha: pagosZelle.fechaTransaccion,
        tipo: pagosZelle.tipo,
        monto: pagosZelle.montoCentavos,
        neto: pagosZelle.netoCentavos,
        codigo: pagosZelle.codigoConfirmacion,
        banco: pagosZelle.bancoOrigen,
        nota: pagosZelle.notas,
      })
      .from(pagosZelle)
      .where(
        and(
          eq(pagosZelle.tiendaId, posicion.tiendaId),
          eq(pagosZelle.estado, "aprobado"),
        ),
      )
      .orderBy(desc(pagosZelle.fechaTransaccion), desc(pagosZelle.id))
      .limit(limite),

    // Los retiros que se pidieron desde el sitio y ya se pagaron.
    db
      .select({
        id: retiros.id,
        fecha: retiros.resueltoEn,
        monto: retiros.montoCentavos,
        referencia: retiros.referencia,
        forma: retiros.forma,
      })
      .from(retiros)
      .where(
        and(
          eq(retiros.tiendaId, posicion.tiendaId),
          eq(retiros.estado, "pagado"),
        ),
      )
      .orderBy(desc(retiros.resueltoEn))
      .limit(limite),

    /* Las ventas cobradas con tarjeta: una fila por pedido, igual que la orden
       de compra. Agrupar por pedido y no por renglón es lo correcto — el
       comercio piensa en ventas, no en líneas de una venta. */
    db
      .select({
        id: tablaPedidos.id,
        numero: tablaPedidos.numero,
        fecha: tablaPedidos.actualizadoEn,
        bruto: sql<number>`COALESCE(SUM(${itemsPedido.subtotalCentavos}), 0)`,
        comision: sql<number>`COALESCE(SUM(${itemsPedido.comisionCentavos}), 0)`,
      })
      .from(itemsPedido)
      .innerJoin(tablaPedidos, eq(tablaPedidos.id, itemsPedido.pedidoId))
      .where(
        and(eq(itemsPedido.tiendaId, posicion.tiendaId), cobradoConTarjeta(db)),
      )
      .groupBy(tablaPedidos.id)
      .orderBy(desc(tablaPedidos.actualizadoEn))
      .limit(limite),

    /* Los cobros por enlace pagados. El neto sale del movimiento que escribió
       la acreditación — el mismo número que suma la posición de arriba: dos
       pantallas que dicen cosas distintas del mismo dinero es como un comercio
       deja de creerle al sistema. */
    db
      .select({
        id: cobrosSolicitados.id,
        fecha: cobrosSolicitados.pagadoEn,
        referencia: cobrosSolicitados.referencia,
        neto: movimientosBilletera.montoCentavos,
      })
      .from(cobrosSolicitados)
      .innerJoin(
        movimientosBilletera,
        and(
          eq(movimientosBilletera.referencia, cobrosSolicitados.pagoId),
          // Solo tarjeta: los pagados por Zelle ya salen como pagos_zelle.
          like(movimientosBilletera.nota, "Cobro por enlace%"),
        ),
      )
      .where(
        and(
          eq(cobrosSolicitados.tiendaId, posicion.tiendaId),
          eq(cobrosSolicitados.estado, "pagado"),
        ),
      )
      .orderBy(desc(cobrosSolicitados.pagadoEn))
      .limit(limite),

    /* Las transferencias RECIBIDAS de otros comercios (31 ago 2026): los
       retiros pagados cuyo destino es esta tienda. Con el nombre del que
       envió — «me llegó plata» sin decir de quién no le sirve a nadie. */
    db
      .select({
        id: retiros.id,
        fecha: retiros.resueltoEn,
        deQuien: tiendas.nombre,
        monto: retiros.montoCentavos,
      })
      .from(retiros)
      .innerJoin(tiendas, eq(tiendas.id, retiros.tiendaId))
      .where(
        and(
          eq(retiros.destinoTiendaId, posicion.tiendaId),
          eq(retiros.forma, "comercio"),
          eq(retiros.estado, "pagado"),
        ),
      )
      .orderBy(desc(retiros.resueltoEn))
      .limit(limite),
  ]);

  const movimientos: MovimientoBilletera[] = [
    ...filas.map((f) => ({
      id: f.id,
      /* `fechaTransaccion` está declarada como timestamp, así que Drizzle la
         devuelve como Date —ya en milisegundos—. Multiplicarla por mil daba el
         año 58548, que es lo que llevaba enseñando esta columna: además de
         verse absurdo, mandaba esos movimientos al principio de la lista y
         empujaba fuera de la pantalla a los de verdad. */
      fecha: f.fecha instanceof Date ? f.fecha.getTime() : null,
      tipo: f.tipo,
      concepto: f.nota ?? f.codigo ?? f.banco,
      montoCentavos: f.tipo === "retiro" ? -Number(f.monto) : Number(f.neto),
      saldoResultanteCentavos: 0,
    })),
    ...salidas.map((s) => ({
      id: s.id,
      // `resueltoEn` llega como Date; multiplicarlo por mil daría el año 58560.
      fecha: s.fecha instanceof Date ? s.fecha.getTime() : null,
      tipo: "retiro" as const,
      concepto: s.referencia ?? s.forma,
      montoCentavos: -Number(s.monto),
      saldoResultanteCentavos: 0,
    })),
    ...conTarjeta.map((v) => ({
      id: v.id,
      fecha: v.fecha instanceof Date ? v.fecha.getTime() : null,
      tipo: "entrada" as const,
      /* El número del pedido, no un identificador de Stripe: es lo que el
         comercio tiene delante en su pantalla de órdenes. */
      concepto: v.numero,
      montoCentavos: Number(v.bruto) - Number(v.comision),
      saldoResultanteCentavos: 0,
    })),
    ...porEnlace.map((c) => ({
      id: c.id,
      fecha: c.fecha instanceof Date ? c.fecha.getTime() : null,
      tipo: "entrada" as const,
      /* La referencia de SU factura, no un identificador de Stripe: es el
         número que la cajera tiene delante en su propio sistema. */
      concepto: c.referencia,
      montoCentavos: Number(c.neto),
      saldoResultanteCentavos: 0,
    })),
    ...recibidas.map((r) => ({
      id: `recibido-${r.id}`,
      fecha: r.fecha instanceof Date ? r.fecha.getTime() : null,
      tipo: "entrada" as const,
      concepto: `Transferencia de ${r.deQuien}`,
      montoCentavos: Number(r.monto),
      saldoResultanteCentavos: 0,
    })),
  ]
    // Del más nuevo al más viejo: la columna de saldo se calcula hacia atrás
    // desde el de hoy, así que el orden no es cosmético.
    .sort((a, b) => (b.fecha ?? 0) - (a.fecha ?? 0))
    .slice(0, limite);

  let saldo = posicion.saldoCentavos;

  return movimientos.map((m) => {
    const saldoResultante = saldo;
    saldo -= m.montoCentavos;
    return { ...m, saldoResultanteCentavos: saldoResultante };
  });
}

/**
 * LA BILLETERA DEL OPERADOR: la comisión de Mercatren.
 *
 * Es una billetera APARTE de la del comercio y nunca se mezclan:
 *
 * - Entra el 3% de cada pago aprobado (eso ya está guardado en cada pago, no
 *   hace falta apuntarlo dos veces).
 * - Sale cuando Mercatren retira lo suyo, y eso sí hay que guardarlo:
 *   `retiros_fee`.
 * - Un retiro del comercio NO toca esta billetera, y un retiro de comisión NO
 *   toca la del comercio. Confundirlas sería restarle al comercio dinero que
 *   nunca fue suyo, o apuntarnos un saldo que en realidad le debemos a él.
 *
 * Solo la ve el equipo de Mercatren: a un comercio no le corresponde saber
 * cuánto lleva ganado el operador.
 */
export type BilleteraOperador = {
  ganadoCentavos: number;
  retiradoCentavos: number;
  disponibleCentavos: number;
  retiros: { id: string; fecha: number; montoCentavos: number }[];
};

export async function obtenerBilleteraOperador(): Promise<BilleteraOperador | null> {
  const alcance = await obtenerAlcance();
  // Un comercio no ve la caja del operador.
  if (alcance.tipo !== "todos") return null;

  const db = getDb();

  const [ganado] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${pagosZelle.comisionCentavos}), 0)`,
    })
    .from(pagosZelle)
    .where(ENTRADA_APROBADA);

  const filas = await db
    .select({
      id: retirosFee.id,
      montoCentavos: retirosFee.montoCentavos,
      hechoEn: retirosFee.hechoEn,
    })
    .from(retirosFee)
    .orderBy(desc(retirosFee.hechoEn));

  const ganadoCentavos = Number(ganado?.total ?? 0);
  const retiradoCentavos = filas.reduce(
    (total, f) => total + Number(f.montoCentavos),
    0,
  );

  return {
    ganadoCentavos,
    retiradoCentavos,
    disponibleCentavos: ganadoCentavos - retiradoCentavos,
    // La nota de cada retiro es interna: no sale de aquí.
    retiros: filas.map((f) => ({
      id: f.id,
      fecha: Number(f.hechoEn) * 1000,
      montoCentavos: Number(f.montoCentavos),
    })),
  };
}

/**
 * LO QUE SE LE DEBE A CADA COMERCIO, TODOS DE UNA.
 *
 * ══ EL FALLO QUE ARREGLA (12 ago 2026) ══
 *
 * «Por pagar a los comercios» es la pantalla que contesta cuanto dinero de
 * otros tenemos en la cuenta. Hasta hoy, cuando la abria el equipo sin pedir un
 * comercio concreto, `tiendaAConsultar()` cogia **la primera billetera que
 * encontrara** y enseñaba SOLO esa: un nombre cualquiera, su saldo, y hasta el
 * boton «Retirar mi dinero», que es del comercio y no del equipo.
 *
 * Lo vio el dueño: la pantalla decia «pendiente de pago $0.00 · MEGAYES»
 * —un comercio que ni siquiera ha subido un producto— mientras el que estaba
 * esperando su dinero era otro, con $29 pedidos. Una pantalla de dinero que
 * enseña un comercio al azar es peor que no tenerla: se mira, se lee «cero» y
 * se cierra tranquilo.
 *
 * Esto devuelve la fila de CADA comercio con billetera. La suma se hace
 * arriba, en la pantalla, para que el total y el detalle no puedan
 * contradecirse.
 *
 * ══ SOLO PARA EL EQUIPO ══
 *
 * Un vendedor que llegue aqui recibe una lista vacia: son los saldos de todos
 * los comercios, incluidos sus competidores.
 */
export type FilaDeComercio = {
  tiendaId: string;
  slug: string;
  nombre: string;
  moneda: string;
  saldoCentavos: number;
  enTramiteCentavos: number;
};

export async function saldosDeTodosLosComercios(): Promise<FilaDeComercio[]> {
  const alcance = await obtenerAlcance();
  if (alcance.tipo === "tienda") return [];

  const db = getDb();

  const filas = await db
    .select({
      tiendaId: tiendas.id,
      slug: tiendas.slug,
      nombre: tiendas.nombre,
      moneda: billeteras.moneda,
    })
    .from(billeteras)
    .innerJoin(tiendas, eq(tiendas.id, billeteras.tiendaId));

  /* Se reutiliza `obtenerPosicion`, que ya sabe sumar Zelle, tarjeta y
     retiros. Calcularlo aparte aqui seria tener dos cuentas del mismo dinero,
     y la que se creeria es la que estuviera mal. */
  const posiciones = await Promise.all(
    filas.map((f) => obtenerPosicion(f.tiendaId)),
  );

  return (
    filas
      .map((f, i) => {
        const p = posiciones[i];
        if (!p) return null;
        return {
          tiendaId: f.tiendaId,
          slug: f.slug,
          nombre: f.nombre,
          moneda: p.moneda,
          saldoCentavos: p.saldoCentavos,
          enTramiteCentavos: p.enTramiteCentavos,
        };
      })
      .filter((f): f is FilaDeComercio => f !== null)
      /* De mayor a menor: lo que hay que pagar primero es lo que mas pesa. */
      .sort((a, b) => b.saldoCentavos - a.saldoCentavos)
  );
}
