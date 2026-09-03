/**
 * EL VIGILANTE: LAS REGLAS, SIN RED NI BASE (2 sep 2026).
 *
 * Lo pidió el dueño después de ver el recálculo de Colombia pegado horas sin
 * que nadie se enterara: «necesitamos un vigilante que tenga el control de
 * todo, que tenga un reporte, que se le pueda preguntar, que en caso de
 * haber algún problema mande un correo». Y una segunda regla: «los productos
 * que no tengan claro el envío no deberían ponerse a la venta».
 *
 * Aquí se decide QUÉ es una alerta y cuándo se avisa. Recibe hechos ya
 * medidos (números y fechas) y devuelve alertas. Por eso se prueba.
 */

export type Nivel = "rojo" | "ambar";

export type Alerta = {
  /** Estable entre corridas: es lo que evita repetir el mismo correo. */
  clave: string;
  nivel: Nivel;
  titulo: string;
  detalle: string;
};

export type Accion = { clave: string; titulo: string; cantidad: number };

export type ImportacionVista = {
  id: string;
  mercado: string;
  estado: string;
  actualizadoEnMs: number;
  tandasPendientes: number;
  tandasConError: number;
  ultimoError: string | null;
  agregados: number;
};

export type PlazaVista = {
  mercado: string;
  publicados: number;
  enRevision: number;
  porAfinar: number;
  sinCostoBase: number;
};

/** Una compra al proveedor o una venta con problema, CON su número y motivo:
 *  un aviso que dice «2 compras con error» sin decir cuáles obliga a entrar
 *  a buscar; uno que las nombra se resuelve desde el correo. */
export type CompraVista = {
  numero: string;
  estado: string;
  motivo: string | null;
  haceMinutos: number;
};

export type Hechos = {
  ahoraMs: number;
  /** Cuándo latió por última vez `/datos/sincronizar`. */
  latidoSincronizarMs: number | null;
  proveedor: string;
  avisoStripe: string;
  importaciones: ImportacionVista[];
  plazas: PlazaVista[];
  /** Lo que el barrido encontró a la venta sin flete real, ANTES de retirarlo. */
  publicadosSinVerificar: number;
  comprasConError: number;
  comprasPorPagarViejas: number;
  ventasSinCompra: number;
  /** Las primeras ocho de cada una, con número y motivo. */
  detalleCompras?: CompraVista[];
  detalleVentasSinCompra?: string[];
  zellePendientesViejos: number;
  retirosSinPagarViejos: number;
  fuentesAtrasadas: string[];
  sinTraducir: number;
};

export const UMBRALES = {
  latidoDelRelojMin: 45,
  importacionQuietaMin: 60,
  compraPorPagarMin: 120,
  ventaSinCompraMin: 30,
  zelleHoras: 24,
  retiroHoras: 72,
  /** Los catálogos de los comercios los relee el flujo de GitHub, que corre
   *  unas cinco veces al día (medido el 2 sep 2026): más de esto sí es raro. */
  fuentesHoras: 6,
  /** Una alerta roja se recuerda por correo a las 6 h; una ámbar al día. */
  avisoRojoHoras: 6,
  avisoAmbarHoras: 24,
} as const;

/** La llave en `configuracion` donde el reloj deja su último latido (ms). */
export const LLAVE_LATIDO_SINCRONIZAR = "sincronizar_ultimo_latido";

/** El reloj, en una función: un componente de servidor no puede llamar a
 *  `Date.now()` directo (regla de pureza del lint), pero sí a esto. */
export function relojAhoraMs(): number {
  return Date.now();
}

export function minutosDesde(
  ms: number | null | undefined,
  ahoraMs: number,
): number | null {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) return null;
  return Math.max(0, Math.round((ahoraMs - ms) / 60_000));
}

const NOMBRE: Record<string, string> = {
  US: "Estados Unidos",
  CL: "Chile",
  CO: "Colombia",
};
/** «1 pago» / «3 pagos»: un plural mal hecho en un aviso se lee como descuido. */
export function plural(n: number, uno: string, varios: string): string {
  return `${n} ${n === 1 ? uno : varios}`;
}

export function nombreDePlaza(mercado: string): string {
  return NOMBRE[mercado] ?? mercado;
}

/** Los fallos que se arreglan solos con volver a intentar. */
export function esFalloPasajero(motivo: string | null | undefined): boolean {
  if (!motivo) return false;
  return /too many requests|qps|no contest|timeout|timed out|fetch failed|network|503|502|ECONNRESET/i.test(
    motivo,
  );
}

function listaDeCompras(h: Hechos, estado: string): string {
  const lista = (h.detalleCompras ?? []).filter((c) => c.estado === estado);
  if (lista.length === 0) return "";
  return ` ${lista
    .map(
      (c) =>
        `${c.numero} (hace ${c.haceMinutos} min${c.motivo ? `: ${c.motivo.slice(0, 160)}` : ""})`,
    )
    .join(" · ")}`;
}

export function evaluar(h: Hechos): Alerta[] {
  const alertas: Alerta[] = [];

  /* 1. El reloj. Si no late, NADA de lo automático corre. */
  const latido = minutosDesde(h.latidoSincronizarMs, h.ahoraMs);
  if (latido === null) {
    alertas.push({
      clave: "reloj-nunca",
      nivel: "ambar",
      titulo: "El reloj de sincronización nunca ha latido",
      detalle:
        "Ninguna corrida de /datos/sincronizar ha dejado su marca. Si el sitio se acaba de publicar, es normal durante unos minutos; si sigue así, revisar el flujo de GitHub y la variable SINCRONIZAR_LLAVE.",
    });
  } else if (latido > UMBRALES.latidoDelRelojMin) {
    alertas.push({
      clave: "reloj-parado",
      nivel: "rojo",
      titulo: `El reloj lleva ${latido} minutos sin latir`,
      detalle:
        "Sin el reloj no avanza la importación de CJ, no se afinan precios ni tallas, no se refresca el stock y no se releen los catálogos de los comercios. Revisar el flujo «sincronizar-catalogos» en GitHub.",
    });
  }

  /* 2. Las llaves de las que depende el dinero. */
  if (h.proveedor !== "ok") {
    alertas.push({
      clave: "proveedor",
      nivel: "rojo",
      titulo: `La conexión con CJ no responde (${h.proveedor})`,
      detalle:
        h.proveedor === "sin_llave"
          ? "Falta CJ_API_KEY en el panel del sitio: no se puede comprar al proveedor ni traer productos."
          : "CJ no contestó a la sonda. Si dura, las ventas de EE. UU. se cobran y el pedido al proveedor no se crea.",
    });
  }
  if (h.avisoStripe !== "ok") {
    alertas.push({
      clave: "aviso-stripe",
      nivel: "rojo",
      titulo: `El aviso de Stripe no está armado (${h.avisoStripe})`,
      detalle:
        "De ese aviso depende que un cobro con tarjeta se acredite solo. Sin él, los cobros entran al banco y los pedidos se quedan en «esperando el pago».",
    });
  }

  /* 3. Las importaciones en marcha. */
  for (const imp of h.importaciones) {
    const quieta = minutosDesde(imp.actualizadoEnMs, h.ahoraMs) ?? 0;
    if (
      imp.estado === "en_curso" &&
      imp.tandasPendientes > 0 &&
      quieta > UMBRALES.importacionQuietaMin
    ) {
      alertas.push({
        clave: `importacion-quieta-${imp.mercado}`,
        nivel: "ambar",
        titulo: `La importación de ${nombreDePlaza(imp.mercado)} lleva ${quieta} minutos sin avanzar`,
        detalle: `Quedan ${imp.tandasPendientes} tandas. El reloj debería empujarla cada vuelta; si el reloj late y esto sigue, CJ no está contestando.${imp.ultimoError ? ` Último aviso: ${imp.ultimoError}` : ""}`,
      });
    }
    if (imp.tandasConError > 0) {
      alertas.push({
        clave: `importacion-errores-${imp.mercado}`,
        nivel: "ambar",
        titulo: `${plural(imp.tandasConError, "tanda", "tandas")} con error en la importación de ${nombreDePlaza(imp.mercado)}`,
        detalle: `Los fallos pasajeros (CJ ocupado) se reintentan solos; los demás quedan aquí para mirarlos.${imp.ultimoError ? ` Último: ${imp.ultimoError}` : ""}`,
      });
    }
  }

  /* 4. El catálogo: lo que no se puede vender bien. */
  for (const p of h.plazas) {
    if (p.sinCostoBase > 0) {
      alertas.push({
        clave: `sin-costo-${p.mercado}`,
        nivel: "ambar",
        titulo: `${plural(p.sinCostoBase, "producto", "productos")} de ${nombreDePlaza(p.mercado)} sin costo base`,
        detalle:
          "Sin costo no hay precio correcto posible: el barrido los deja en revisión. Se arreglan volviéndolos a traer del proveedor.",
      });
    }
  }

  /* 5. El dinero: compras al proveedor y ventas cobradas. */
  if (h.comprasConError > 0) {
    alertas.push({
      clave: "compras-con-error",
      nivel: "rojo",
      titulo: `${plural(h.comprasConError, "compra al proveedor", "compras al proveedor")} con error`,
      detalle: `Son ventas ya cobradas cuyo pedido a CJ no se pudo crear o pagar. Panel → Pedidos al proveedor.${listaDeCompras(h, "con_error")}`,
    });
  }
  if (h.comprasPorPagarViejas > 0) {
    alertas.push({
      clave: "compras-por-pagar",
      nivel: "rojo",
      titulo: `${plural(h.comprasPorPagarViejas, "compra al proveedor lleva", "compras al proveedor llevan")} más de ${UMBRALES.compraPorPagarMin / 60} horas sin pagar`,
      detalle: `El pago automático no salió (margen, CJ o la cuenta del proveedor). Hay que pagarlas desde Panel → Pedidos al proveedor o el cliente no recibe su compra.${listaDeCompras(h, "por_pagar")}`,
    });
  }
  if (h.ventasSinCompra > 0) {
    alertas.push({
      clave: "ventas-sin-compra",
      nivel: "rojo",
      titulo: `${plural(h.ventasSinCompra, "venta pagada", "ventas pagadas")} de productos de CJ sin pedido al proveedor`,
      detalle: `El cliente ya pagó y no existe ningún pedido a CJ. Abrir cada pedido en Panel → Órdenes y usar «Comprar al proveedor».${h.detalleVentasSinCompra?.length ? ` Pedidos: ${h.detalleVentasSinCompra.join(", ")}.` : ""}`,
    });
  }

  /* 6. Lo que espera a una persona. */
  if (h.zellePendientesViejos > 0) {
    alertas.push({
      clave: "zelle-por-validar",
      nivel: "ambar",
      titulo: `${plural(h.zellePendientesViejos, "pago por Zelle lleva", "pagos por Zelle llevan")} más de ${UMBRALES.zelleHoras} horas sin validar`,
      detalle:
        "Panel → Por validar. El comprador está esperando que su pedido arranque.",
    });
  }
  if (h.retirosSinPagarViejos > 0) {
    alertas.push({
      clave: "retiros-sin-pagar",
      nivel: "ambar",
      titulo: `${plural(h.retirosSinPagarViejos, "retiro pedido lleva", "retiros pedidos llevan")} más de ${UMBRALES.retiroHoras / 24} días sin pagar`,
      detalle: "Panel → Retiros. Un comercio está esperando su dinero.",
    });
  }
  if (h.fuentesAtrasadas.length > 0) {
    alertas.push({
      clave: "fuentes-atrasadas",
      nivel: "ambar",
      titulo: `${plural(h.fuentesAtrasadas.length, "catálogo de comercio", "catálogos de comercios")} sin releer`,
      detalle: `Llevan más de ${UMBRALES.fuentesHoras} horas sin releerse: ${h.fuentesAtrasadas.join(", ")}. Su stock aquí puede no ser el de su mostrador.`,
    });
  }

  return alertas;
}

/** ¿Toca mandar correo por esta alerta, o ya se avisó hace poco? */
export function hayQueAvisar(
  nivel: Nivel,
  avisadoEnMs: number | null,
  ahoraMs: number,
): boolean {
  if (avisadoEnMs === null) return true;
  const horas =
    nivel === "rojo" ? UMBRALES.avisoRojoHoras : UMBRALES.avisoAmbarHoras;
  return ahoraMs - avisadoEnMs >= horas * 60 * 60 * 1000;
}

/** El correo al equipo: asunto y párrafos, sin HTML. */
export function textoDelCorreo(
  alertas: Alerta[],
  acciones: Accion[],
): { asunto: string; lineas: string[] } {
  const rojas = alertas.filter((a) => a.nivel === "rojo").length;
  const asunto =
    rojas > 0
      ? `Vigilante: ${rojas} ${rojas === 1 ? "alerta roja" : "alertas rojas"} en Mercatren`
      : `Vigilante: ${alertas.length} ${alertas.length === 1 ? "aviso" : "avisos"} en Mercatren`;
  const lineas = alertas.map(
    (a) => `${a.nivel === "rojo" ? "🔴" : "🟠"} ${a.titulo}. ${a.detalle}`,
  );
  const hechas = acciones.filter((x) => x.cantidad > 0);
  if (hechas.length > 0) {
    lineas.push(
      `Lo que el vigilante ya hizo solo: ${hechas.map((x) => `${x.titulo} (${x.cantidad})`).join(" · ")}.`,
    );
  }
  return { asunto, lineas };
}
