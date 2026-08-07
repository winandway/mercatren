/**
 * LAS CUENTAS DEL CRÉDITO.
 *
 * Funciones puras, sin base de datos, para poder probarlas de verdad. Aquí se
 * decide cuánto puede comprar un cliente a crédito y cuánto debe — o sea,
 * dinero. Un error en este archivo le cuesta plata a un comercio.
 *
 * DOS REGLAS QUE NO SE NEGOCIAN:
 *
 * 1. **Todo en centavos enteros.** Nunca decimales. Es la regla del proyecto y
 *    aquí es todavía más importante: un céntimo perdido por redondeo en cada
 *    abono, multiplicado por cientos de abonos, es dinero real que alguien
 *    reclama.
 *
 * 2. **Lo debido se CALCULA, no se guarda.** Se suma de los pedidos y sus
 *    abonos cada vez que hace falta. Guardar un total además de los
 *    movimientos es tener dos verdades, y el día que un fallo deje una a
 *    medias, nadie sabe cuál es la buena. Ya se aprendió con la billetera.
 */

/**
 * El tope máximo que un comercio puede dar de crédito.
 *
 * No es desconfianza hacia el comercio: es que un cero de más al teclear
 * ($200.000 en vez de $20.000) se convierte en mercancía entregada que nadie va
 * a pagar. Un tope alto pero finito atrapa el error de dedo.
 *
 * VIVE AQUÍ Y NO EN `acciones.ts` porque aquel archivo es `"use server"`, y ahí
 * solo se pueden exportar funciones async. Exportar una constante de un archivo
 * de acciones no compila — y el error que da no dice eso, dice que la página
 * entera reventó.
 */
export const TOPE_MAXIMO_CENTAVOS = 5_000_000; // $50.000

/** Un pedido a crédito con lo que lleva abonado. */
export type PedidoACredito = {
  totalCentavos: number;
  abonadoCentavos: number;
};

export type Cupo = {
  /** El tope que le puso el comercio. */
  topeCentavos: number;
  /** Lo que debe ahora mismo: la suma de lo que falta por pagar. */
  usadoCentavos: number;
  /** Lo que todavía puede comprar. */
  disponibleCentavos: number;
};

/**
 * Qué le falta pagar a un pedido.
 *
 * Nunca devuelve negativo: si alguien abonó de más —pasa, un cliente que manda
 * $500 cuando debía $480—, el pedido está saldado y el sobrante no se convierte
 * en una deuda al revés. Lo que sobre se trata aparte, con una persona
 * mirándolo.
 */
export function pendienteDePedido(pedido: PedidoACredito): number {
  return Math.max(0, pedido.totalCentavos - pedido.abonadoCentavos);
}

/**
 * El cupo de un cliente, mirando todos sus pedidos a crédito abiertos.
 *
 * **Cada abono libera cupo.** Es a propósito y es lo que hace útil el sistema:
 * un cliente con tope de $2.000 que ya abonó $1.700 puede volver a comprar
 * $1.700 sin esperar a saldar los $300 que le faltan. Así el comercio vende
 * más, que es de lo que se trata.
 */
export function calcularCupo(
  topeCentavos: number,
  pedidosAbiertos: PedidoACredito[],
): Cupo {
  const usadoCentavos = pedidosAbiertos.reduce(
    (suma, p) => suma + pendienteDePedido(p),
    0,
  );

  return {
    topeCentavos,
    usadoCentavos,
    /* No baja de cero. Si un comercio le RECORTA el tope a alguien que ya debía
       más, el disponible es cero — no un número negativo que luego se reste mal
       en alguna pantalla. */
    disponibleCentavos: Math.max(0, topeCentavos - usadoCentavos),
  };
}

export type Veredicto =
  | { puede: true }
  | {
      puede: false;
      motivo: "sinCredito" | "suspendido" | "noAlcanza" | "montoInvalido";
    };

/**
 * ¿Puede llevarse esta compra a crédito?
 *
 * Se comprueba SIEMPRE en el servidor antes de crear el pedido. Lo que diga la
 * pantalla es comodidad; cualquiera puede mandar la petición a mano.
 */
export function puedeComprarACredito(
  cupo: Cupo | null,
  estadoCredito: "activo" | "suspendido" | null,
  montoCentavos: number,
): Veredicto {
  if (!Number.isInteger(montoCentavos) || montoCentavos <= 0) {
    return { puede: false, motivo: "montoInvalido" };
  }
  if (!cupo || !estadoCredito) return { puede: false, motivo: "sinCredito" };
  if (estadoCredito === "suspendido") {
    return { puede: false, motivo: "suspendido" };
  }
  if (montoCentavos > cupo.disponibleCentavos) {
    return { puede: false, motivo: "noAlcanza" };
  }
  return { puede: true };
}

/**
 * Hasta cuándo tiene para pagar.
 *
 * Se trabaja con segundos enteros porque así es como guarda las fechas la base
 * de este proyecto (epoch en segundos). Pasarle un objeto Date a D1 lo rechaza
 * con `D1_TYPE_ERROR`.
 */
export function fechaVencimiento(desdeMs: number, diasPlazo: number): Date {
  const dias = Math.max(1, Math.floor(diasPlazo));
  return new Date(desdeMs + dias * 24 * 60 * 60 * 1000);
}

export type EstadoPedidoCredito = "abierto" | "pagado" | "vencido";

/**
 * En qué punto está un pedido a crédito.
 *
 * **Pagado gana siempre sobre vencido.** Si alguien terminó de abonar un día
 * después del plazo, ese pedido está pagado y punto: marcarlo "vencido" cuando
 * ya no debe nada sería decirle a un cliente que está en falta cuando cumplió.
 */
export function estadoDelPedido(
  pedido: PedidoACredito,
  venceEnMs: number,
  ahoraMs: number,
): EstadoPedidoCredito {
  if (pendienteDePedido(pedido) === 0) return "pagado";
  return ahoraMs > venceEnMs ? "vencido" : "abierto";
}

/** Cuántos días faltan (o cuántos pasaron, en negativo) para el vencimiento. */
export function diasParaVencer(venceEnMs: number, ahoraMs: number): number {
  return Math.ceil((venceEnMs - ahoraMs) / (24 * 60 * 60 * 1000));
}

/**
 * El porcentaje abonado, de 0 a 100, para la barra de avance.
 *
 * Un pedido de total cero no existe en la práctica, pero si llegara, se cuenta
 * como pagado: dividir entre cero pintaría `NaN` en la pantalla del cliente.
 */
export function porcentajeAbonado(pedido: PedidoACredito): number {
  if (pedido.totalCentavos <= 0) return 100;
  const bruto = (pedido.abonadoCentavos / pedido.totalCentavos) * 100;
  return Math.min(100, Math.max(0, Math.round(bruto)));
}
