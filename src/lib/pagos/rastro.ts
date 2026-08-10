/**
 * CÓMO SE PAGÓ CADA VENTA, dicho en un solo lenguaje.
 *
 * ══ POR QUÉ HACE FALTA ESTO ══
 *
 * El sistema guarda el método de pago desde el primer pedido, pero hasta hoy
 * NINGUNA pantalla lo enseñaba. Para saber si una venta entró por tarjeta o
 * por Zelle había que ir a «Pagos Zelle» y, si no estaba ahí, deducir que fue
 * con tarjeta. Averiguar por descarte cómo entró el dinero no es una forma de
 * trabajar: es como se pierde la pista de un cobro.
 *
 * ══ POR QUÉ ES UNA PIEZA APARTE Y PURA ══
 *
 * Los dos métodos guardan su rastro en tablas distintas —`pagos` para la
 * tarjeta, `pagos_zelle` para el comprobante— y con estados que se llaman
 * distinto (`confirmado` contra `aprobado`). Traducir eso en cada pantalla
 * garantiza que tarde o temprano una diga una cosa y otra diga otra. Se
 * traduce UNA vez, aquí, y se prueba.
 */

/** Cómo eligió pagar el comprador. Sale del pedido, no del cobro. */
export type MetodoPago = "stripe" | "zelle" | "billetera";

/**
 * En qué punto está el cobro, hablando de los dos métodos a la vez.
 *
 * `sin_pago` no es un error: es un pedido recién creado que todavía no se ha
 * pagado. Es distinto de `rechazado`, y confundirlos haría que el panel diera
 * por perdida una venta que apenas empieza.
 */
export type EstadoRastro =
  "sin_pago" | "en_revision" | "confirmado" | "rechazado" | "reembolsado";

export type DatosRastro = {
  /** `pedidos.metodo_pago`. Null en pedidos anteriores a que se guardara. */
  metodo: string | null;
  /** `pagos.estado` del cobro con tarjeta, si existe. */
  estadoTarjeta?: string | null;
  /** `pagos.referencia_externa`: el identificador del cobro en Stripe. */
  referenciaTarjeta?: string | null;
  /** `pagos_zelle.estado` del comprobante más reciente, si existe. */
  estadoZelle?: string | null;
  /** El código que da el banco al transferir. Es lo que se busca en el banco. */
  codigoZelle?: string | null;
  bancoZelle?: string | null;
  ultimosCuatroZelle?: string | null;
  /** `pedidos.estado`. Manda cuando no se encuentra la fila del cobro. */
  estadoPedido?: string | null;
};

export type Rastro = {
  metodo: MetodoPago | null;
  estado: EstadoRastro;
  /**
   * Lo que identifica el cobro ante quien lo procesó. Null cuando no hay nada
   * que enseñar todavía.
   */
  referencia: string | null;
};

const METODOS: readonly string[] = ["stripe", "zelle", "billetera"];

/** Ante un valor desconocido, null: es mejor no decir nada que decir de más. */
function metodoValido(valor: string | null | undefined): MetodoPago | null {
  return valor && METODOS.includes(valor) ? (valor as MetodoPago) : null;
}

/**
 * El estado del cobro con tarjeta. `pagos.estado` ya viene en este idioma;
 * lo único que se decide aquí es qué significa que no haya fila.
 */
function estadoDeTarjeta(estado: string | null | undefined): EstadoRastro {
  switch (estado) {
    case "confirmado":
      return "confirmado";
    case "rechazado":
      return "rechazado";
    case "reembolsado":
      return "reembolsado";
    case "pendiente":
      return "en_revision";
    default:
      return "sin_pago";
  }
}

/**
 * El estado del comprobante de Zelle.
 *
 * `aprobado` y `confirmado` son la misma cosa contada por dos módulos: uno lo
 * aprueba una persona mirando el banco y el otro lo confirma Stripe solo. Para
 * quien mira el panel es lo mismo — el dinero entró — y por eso se unifican.
 */
function estadoDeZelle(estado: string | null | undefined): EstadoRastro {
  switch (estado) {
    case "aprobado":
      return "confirmado";
    case "rechazado":
      return "rechazado";
    case "pendiente":
      return "en_revision";
    default:
      return "sin_pago";
  }
}

/**
 * Con qué se identifica un pago por Zelle.
 *
 * Se prefiere el código de confirmación porque es lo que se escribe en el
 * buscador del banco. Si no llegó, sirve el banco con los últimos cuatro
 * dígitos: no es exacto, pero acota la búsqueda. **Los últimos cuatro solos no
 * se enseñan**: cuatro dígitos sueltos, sin decir de qué cuenta son, no llevan
 * a ninguna parte y parecen un dato más de los que ya hay.
 */
function referenciaDeZelle(d: DatosRastro): string | null {
  const codigo = d.codigoZelle?.trim();
  if (codigo) return codigo;

  const banco = d.bancoZelle?.trim();
  const cuatro = d.ultimosCuatroZelle?.trim();
  if (banco) return cuatro ? `${banco} ····${cuatro}` : banco;

  return null;
}

/**
 * EL ESTADO DEL PEDIDO MANDA CUANDO NO APARECE EL COBRO.
 *
 * Un pedido entregado se cobró: es imposible que no. Pero la fila del cobro
 * puede no estar —el histórico importado llegó sin enlazar a su pedido, y
 * cualquier venta cerrada a mano queda igual—, y sin esta regla el panel
 * enseñaba «Entregado» y «sin pagar» uno al lado del otro, en la misma línea.
 *
 * Un comercio que lee eso deja de creerle a la pantalla, y con razón.
 *
 * Se aplica SOLO cuando el rastro no encontró nada. Si hay una fila que dice
 * «rechazado», eso se respeta y se enseña: ahí sí hay una contradicción de
 * verdad, y taparla sería esconder justo lo que hay que revisar.
 */
function segunElPedido(estadoPedido: string | null | undefined): EstadoRastro {
  switch (estadoPedido) {
    case "pagado":
    case "preparando":
    case "enviado":
    case "entregado":
      return "confirmado";
    case "reembolsado":
      return "reembolsado";
    default:
      // `pendiente_pago` y `cancelado` no se cobraron, y eso es correcto.
      return "sin_pago";
  }
}

/**
 * El rastro de un pago, listo para dibujar.
 *
 * REGLA QUE NO SE TOCA: **sin cobro confirmado no se enseña la referencia.**
 * Un identificador de Stripe existe desde que se abre el intento de cobro,
 * mucho antes de que el dinero entre. Enseñarlo junto a un pedido sin pagar
 * haría creer que ya se cobró — y eso es despachar mercancía que nadie pagó.
 */
export function rastroDelPago(d: DatosRastro): Rastro {
  const metodo = metodoValido(d.metodo);

  if (metodo === "zelle") {
    const encontrado = estadoDeZelle(d.estadoZelle);
    const estado =
      encontrado === "sin_pago" ? segunElPedido(d.estadoPedido) : encontrado;
    return {
      metodo,
      estado,
      /* En Zelle la referencia sí sirve aunque esté en revisión: es
         justamente lo que el validador busca en el banco para aprobarlo.
         Se mira `encontrado`, no `estado`: si el cobro se dio por bueno por
         el estado del pedido, no hay comprobante del que sacarla. */
      referencia: encontrado === "sin_pago" ? null : referenciaDeZelle(d),
    };
  }

  const encontrado = estadoDeTarjeta(d.estadoTarjeta);
  const estado =
    encontrado === "sin_pago" ? segunElPedido(d.estadoPedido) : encontrado;

  return {
    metodo,
    estado,
    referencia:
      encontrado === "confirmado" || encontrado === "reembolsado"
        ? (d.referenciaTarjeta?.trim() ?? null) || null
        : null,
  };
}

/** Si ya entró el dinero. Es lo que decide si se puede despachar. */
export function estaCobrado(rastro: Rastro): boolean {
  return rastro.estado === "confirmado";
}
