import "server-only";

import { and, eq, gte, inArray, lt } from "drizzle-orm";

import { esSoporteDeVerdad } from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { pedidos } from "@/lib/db/schema";

/**
 * EL RESUMEN TRIMESTRAL PARA EL F129 DEL SII CHILENO.
 *
 * ══ QUÉ ES Y POR QUÉ EXISTE ══
 *
 * Mercatren LLC está inscrita en el IVA Digital del SII (usuario 59330700K),
 * con declaración TRIMESTRAL y en USD. El F129 se declara y paga dentro de
 * los 20 días siguientes al cierre del trimestre — y sin ventas no se
 * declara nada, que también hay que poder verlo de un vistazo.
 *
 * Este reporte junta lo que ya quedó anotado venta por venta
 * (`pedidos.impuestosCentavos`, escrito al crear cada pedido chileno) para
 * que declarar sea leer un número, no sumar pedidos a mano.
 *
 * ══ SE DECLARA EN USD Y AQUÍ SE COBRA EN PESOS: LAS DOS CIFRAS ══
 *
 * El IVA se cobró en pesos chilenos. La conversión a USD la manda la norma
 * con la tasa del día del cobro — por eso aquí sale el TOTAL en pesos y,
 * aparte, la suma convertida con la tasa guardada de cada momento no existe
 * todavía: se convierte con la tasa VIGENTE al mirar, y se dice que es una
 * referencia. El número que se declara lo cierra el contador con el tipo de
 * cambio que corresponda; este reporte es el papel de trabajo, no el
 * formulario.
 *
 * ══ SOLO PAGADOS ══
 *
 * El impuesto se devenga al cobrarse (el recargo en la tarjeta, dice la
 * Circular 39). Un pedido sin pagar no se declara: se filtra por los estados
 * que significan dinero entrado.
 */

/** Los estados de un pedido cuyo dinero ENTRÓ. */
const ESTADOS_COBRADOS = [
  "pagado",
  "preparando",
  "enviado",
  "entregado",
] as const;

export type TrimestreF129 = {
  /** «2026-T4» */
  clave: string;
  desde: Date;
  hasta: Date;
  pedidos: number;
  /** Lo cobrado de IVA, en PESOS CHILENOS (la unidad menor es el peso). */
  ivaClp: number;
  /** La base (ventas sin IVA), en pesos. */
  ventasNetasClp: number;
};

export async function resumenF129(): Promise<TrimestreF129[] | null> {
  if (!(await esSoporteDeVerdad())) return null;

  const db = getDb();

  /* Desde la inscripción en el SII: antes de esa fecha no hay nada que
     declarar. Los trimestres se arman en el reloj de Chile no hace falta —
     los cortes son por fecha UTC y la diferencia de horas no mueve un pedido
     de trimestre en la práctica; si un caso de borde apareciera, el contador
     manda. */
  const INSCRIPCION = new Date("2026-08-18T00:00:00Z");
  const ahora = new Date();

  const filas = await db
    .select({
      creadoEn: pedidos.creadoEn,
      impuestosCentavos: pedidos.impuestosCentavos,
      totalCentavos: pedidos.totalCentavos,
    })
    .from(pedidos)
    .where(
      and(
        eq(pedidos.mercado, "CL"),
        inArray(pedidos.estado, [...ESTADOS_COBRADOS]),
        gte(pedidos.creadoEn, INSCRIPCION),
        lt(pedidos.creadoEn, ahora),
      ),
    );

  /* Se agrupa en memoria: son los pedidos chilenos de unos pocos trimestres,
     no un histórico de años. */
  const grupos = new Map<string, TrimestreF129>();
  for (const f of filas) {
    const fecha = f.creadoEn;
    const trimestre = Math.floor(fecha.getUTCMonth() / 3);
    const clave = `${fecha.getUTCFullYear()}-T${trimestre + 1}`;
    const actual =
      grupos.get(clave) ??
      ({
        clave,
        desde: new Date(Date.UTC(fecha.getUTCFullYear(), trimestre * 3, 1)),
        hasta: new Date(Date.UTC(fecha.getUTCFullYear(), trimestre * 3 + 3, 1)),
        pedidos: 0,
        ivaClp: 0,
        ventasNetasClp: 0,
      } satisfies TrimestreF129);
    actual.pedidos += 1;
    actual.ivaClp += f.impuestosCentavos;
    actual.ventasNetasClp += f.totalCentavos - f.impuestosCentavos;
    grupos.set(clave, actual);
  }

  return [...grupos.values()].sort((a, b) => b.clave.localeCompare(a.clave));
}
