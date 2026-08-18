/**
 * ¿ESTÁ LISTO EL COBRO POR ENLACE?
 *
 * ══ POR QUÉ ESTA PANTALLA EXISTE ══
 *
 * El día que un comercio real pulse «cobrar» desde su caja, el circuito toca
 * cuatro servicios distintos: la base, Stripe, el correo y Zelle. Si falta una
 * variable, **no falla al configurarla: falla delante del pagador**, con la
 * tarjeta en la mano.
 *
 * Y falla de formas que no se parecen entre sí. Sin la clave pública de
 * Stripe el formulario de tarjeta **no se dibuja** —una pantalla que se queda
 * en blanco, sin error—; sin el secreto del webhook el pago SÍ se cobra pero
 * nunca se acredita solo; sin el correo receptor de Zelle la opción no puede
 * salir. Tres síntomas distintos del mismo tipo de olvido.
 *
 * ══ POR QUÉ ES PURO Y NO LEE EL ENTORNO ══
 *
 * Recibe qué está puesto y devuelve el veredicto. Así se puede probar entero,
 * y sobre todo: **nunca puede filtrar un valor**. Esta pantalla la abre gente
 * del equipo desde cualquier sitio; lo que se enseña es si la variable EXISTE,
 * jamás lo que dice.
 */

/** Cada cosa que el cobro por enlace necesita para funcionar. */
export type Requisito = {
  /** La variable de entorno, para poder buscarla en el panel del sitio. */
  clave: string;
  /** Qué se rompe si falta. En palabras de lo que ve una persona. */
  siFalta: string;
  /** `true` cuando sin esto NO se puede cobrar de ninguna forma. */
  bloquea: boolean;
};

export const REQUISITOS: readonly Requisito[] = [
  {
    clave: "STRIPE_SECRET_KEY",
    siFalta: "No se puede cobrar con tarjeta.",
    bloquea: true,
  },
  {
    /* El que faltaba en las comprobaciones del panel. Es el más traicionero:
       la página carga, el botón está, y el formulario de tarjeta simplemente
       no aparece — sin un solo mensaje de error. */
    clave: "STRIPE_CLAVE_PUBLICA",
    siFalta: "El formulario de tarjeta no se dibuja: la pantalla sale vacía.",
    bloquea: true,
  },
  {
    /* Sin esto el cobro SÍ se hace, pero el aviso de Stripe se rechaza por
       firma y el dinero no se acredita solo. La conciliación al abrir la
       página lo rescata, así que no bloquea — pero deja el cobro colgando
       hasta que alguien mire. */
    clave: "STRIPE_WEBHOOK_SECRET",
    siFalta: "El pago se cobra pero no se acredita solo; hay que conciliarlo.",
    bloquea: false,
  },
  {
    clave: "ZELLE_CORREO_RECEPTOR",
    siFalta: "No se puede ofrecer Zelle: no hay a quién transferir.",
    bloquea: false,
  },
  {
    clave: "CLOUDFLARE_EMAIL_TOKEN",
    siFalta:
      "El enlace de cobro no le llega por correo a quien tiene que pagar.",
    bloquea: false,
  },
];

export type Veredicto = {
  /** Se puede cobrar con tarjeta, que es el camino principal. */
  puedeCobrar: boolean;
  /** Lo que falta y bloquea. */
  bloqueantes: Requisito[];
  /** Lo que falta y solo recorta el servicio. */
  avisos: Requisito[];
};

/**
 * El veredicto, a partir de qué variables están puestas.
 *
 * `puestas` trae SOLO los nombres de las que existen — nunca sus valores.
 */
export function revisarCobroPorEnlace(puestas: Set<string>): Veredicto {
  const faltan = REQUISITOS.filter((r) => !puestas.has(r.clave));

  return {
    puedeCobrar: !faltan.some((r) => r.bloquea),
    bloqueantes: faltan.filter((r) => r.bloquea),
    avisos: faltan.filter((r) => !r.bloquea),
  };
}
