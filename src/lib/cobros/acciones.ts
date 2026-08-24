"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { idDeRegistro, revisar } from "@/lib/validacion/acciones";
import { sePuedePagar, type EstadoCobro } from "@/lib/cobros/reglas";
import { getDb } from "@/lib/db";
import {
  billeteras,
  cobrosSolicitados,
  movimientosBilletera,
  tiendas,
} from "@/lib/db/schema";
import { calcularComisionCentavos, COMISION_TARJETA_PB } from "@/lib/dinero";
import { getStripe, stripeConfigurado } from "@/lib/stripe";
import { sufijoDelExtracto } from "@/lib/pagos/descriptor";

/**
 * PAGAR UN COBRO PEDIDO POR UN COMERCIO.
 *
 * ══ POR QUÉ NO SE REUSA `crearIntentoDePago` ══
 *
 * Ese exige sesión y un pedido con renglones de catálogo. Aquí no hay ni una
 * cosa ni la otra: la venta ya ocurrió en el mostrador del comercio, y quien
 * paga muchas veces ni siquiera es su cliente — es su hijo en Estados Unidos,
 * a quien le reenviaron el correo. Pedirle que se registre antes de pagar es
 * justo el paso donde se pierde la venta.
 *
 * El secreto del enlace es lo que autoriza. Es de 24 bytes al azar y solo
 * viaja en ese correo.
 */

export type IntentoDeCobro =
  | { ok: true; clientSecret: string; clavePublica: string }
  | { ok: false; motivo: "sin_configurar" | "no_pagable" | "no_existe" };

export async function intentoParaCobro(
  enlace: string,
): Promise<IntentoDeCobro> {
  if (!stripeConfigurado()) return { ok: false, motivo: "sin_configurar" };

  /* El enlace llega por la dirección del navegador y es lo único que protege
     este cobro: se comprueba su forma antes de buscarlo. */
  const revisado = revisar(idDeRegistro, enlace);
  if (!revisado.ok) return { ok: false, motivo: "no_existe" };
  enlace = revisado.datos;

  const db = getDb();

  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      montoCentavos: cobrosSolicitados.montoCentavos,
      estado: cobrosSolicitados.estado,
      venceEn: cobrosSolicitados.venceEn,
      referencia: cobrosSolicitados.referencia,
      tiendaId: cobrosSolicitados.tiendaId,
    })
    .from(cobrosSolicitados)
    .where(eq(cobrosSolicitados.enlace, enlace))
    .limit(1);

  if (!cobro) return { ok: false, motivo: "no_existe" };

  /* El vencimiento se comprueba AQUÍ, contra el reloj, y no confiando en el
     estado guardado. Un enlace caducado que siga cobrando es cobrarle a
     alguien por una venta que el comercio ya dio por perdida. */
  if (!sePuedePagar(cobro.estado as EstadoCobro, cobro.venceEn, new Date())) {
    return { ok: false, motivo: "no_pagable" };
  }

  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const { env } = getCloudflareContext();

  const intento = await getStripe().paymentIntents.create({
    amount: cobro.montoCentavos,
    currency: "usd",
    automatic_payment_methods: { enabled: true },
    metadata: { cobroId: cobro.id, referencia: cobro.referencia },
    description: `Mercatren · ${cobro.referencia}`,
    /* Lo que ve en su estado de cuenta, junto al prefijo de la cuenta. Va la
       referencia de la factura del comercio: quien paga suele ser un familiar
       en Estados Unidos, y semanas después es lo único que le permite atar ese
       cargo a la compra que le pidieron. La referencia la escribe una persona
       en un mostrador, así que se limpia antes: con un acento o una comilla
       dentro, Stripe rechaza el cobro completo. */
    statement_descriptor_suffix: sufijoDelExtracto(cobro.referencia),
  });

  if (!intento.client_secret) return { ok: false, motivo: "no_pagable" };

  /**
   * AQUÍ NO SE ESCRIBE EN `pagos`, Y NO ES UN OLVIDO.
   *
   * `pagos.pedido_id` tiene llave foránea contra `pedidos`, y un cobro por
   * enlace NO es un pedido: el insert revienta con FOREIGN KEY constraint
   * failed — probado contra la base el 15 ago 2026 — y le tumbaba la pantalla
   * de pago al pagador en el momento exacto de meter la tarjeta.
   *
   * El rastro del cobro no se pierde: el intento (`pi_…`) queda guardado en
   * `cobros_solicitados.pago_id` al acreditarse, que es donde este dinero se
   * consulta de verdad.
   */
  return {
    ok: true,
    clientSecret: intento.client_secret,
    clavePublica: env.STRIPE_CLAVE_PUBLICA!,
  };
}

/**
 * ACREDITAR UN COBRO QUE YA SE PAGÓ.
 *
 * Lo llama el webhook de Stripe cuando el intento trae `cobroId` en su
 * metadata, y también la propia página cuando el comprador vuelve — el mismo
 * respaldo que los pedidos, por si el aviso de Stripe no llega.
 *
 * ══ ES IDEMPOTENTE ══
 *
 * El cobro solo se toca si sigue `abierto`, y ese estado va DENTRO del WHERE.
 * Si el webhook y el respaldo entran a la vez, uno de los dos no encuentra
 * nada que hacer y se va sin mover un centavo.
 */
export async function acreditarCobro(
  cobroId: string,
  intentoId: string,
): Promise<void> {
  const db = getDb();
  const ahora = new Date();

  /* El estado va DENTRO del WHERE, y esa condición ES el candado: Stripe
     reintenta los webhooks, y el respaldo de la página puede entrar a la vez.
     El segundo en llegar actualiza cero filas y se va sin acreditar nada — un
     reintento que acreditara otra vez sería dinero duplicado en la billetera
     del comercio. */
  const marcado = await db
    .update(cobrosSolicitados)
    .set({ estado: "pagado", pagadoEn: ahora, pagoId: intentoId })
    .where(
      and(
        eq(cobrosSolicitados.id, cobroId),
        eq(cobrosSolicitados.estado, "abierto"),
      ),
    )
    .returning({
      tiendaId: cobrosSolicitados.tiendaId,
      montoCentavos: cobrosSolicitados.montoCentavos,
      referencia: cobrosSolicitados.referencia,
      contactoCorreo: cobrosSolicitados.contactoCorreo,
      contactoNombre: cobrosSolicitados.contactoNombre,
    });

  const cobro = marcado[0];
  if (!cobro) return;

  /* Al comercio le toca el neto: el monto menos el margen de Mercatren. El
     costo del procesador ya está dentro de lo que cobró Stripe. */
  const comision = calcularComisionCentavos(
    cobro.montoCentavos,
    COMISION_TARJETA_PB,
  );
  const neto = cobro.montoCentavos - comision;

  let [billetera] = await db
    .select({ id: billeteras.id, saldoCentavos: billeteras.saldoCentavos })
    .from(billeteras)
    .where(eq(billeteras.tiendaId, cobro.tiendaId))
    .limit(1);

  /* Sin billetera se CREA, no se salta: saltarla dejaba el cobro pagado sin
     su movimiento, y ese movimiento es de donde la posición del comercio lee
     el neto exacto. Un dinero cobrado que no aparece en ninguna pantalla es
     el fallo más caro de todos. */
  if (!billetera) {
    billetera = { id: `billetera-${nanoid(10)}`, saldoCentavos: 0 };
    await db
      .insert(billeteras)
      .values({ id: billetera.id, tiendaId: cobro.tiendaId })
      .catch(() => undefined);
  }

  await db.insert(movimientosBilletera).values({
    id: `mov-${nanoid(12)}`,
    billeteraId: billetera.id,
    tipo: "recarga",
    montoCentavos: neto,
    saldoResultanteCentavos: billetera.saldoCentavos + neto,
    referencia: intentoId,
    nota: `Cobro por enlace · ${cobro.referencia}`,
    creadoEn: ahora,
  });

  /* Los tres avisos van en su propio try: si un correo falla, el cobro sigue
     acreditado. Un pago no se deshace porque un aviso no salió. */
  try {
    const [duenno] = await db
      .select({ propietarioId: tiendas.propietarioId, nombre: tiendas.nombre })
      .from(tiendas)
      .where(eq(tiendas.id, cobro.tiendaId))
      .limit(1);

    const correos = await import("@/lib/correo/correos");

    /* 1. Al comercio: le entró su dinero. */
    if (duenno?.propietarioId) {
      const { contactoDeUsuario } = await import("@/lib/correo/contactos");
      const contacto = await contactoDeUsuario(duenno.propietarioId);
      if (contacto) {
        await correos.correoVentaAcreditada(contacto, {
          montoCentavos: neto,
          referencia: cobro.referencia,
        });
      }
    }

    /* 2. Al pagador: su recibo. Semanas después, cuando vea el cargo en su
       estado de cuenta, este correo es lo que le recuerda qué pagó — y el
       primer paso de un contracargo es justamente no reconocer un cargo. */
    if (cobro.contactoCorreo) {
      await correos.correoReciboDeCobro(
        {
          email: cobro.contactoCorreo,
          name: cobro.contactoNombre ?? "",
          idioma: "es",
        },
        {
          comercio: duenno?.nombre ?? "",
          referencia: cobro.referencia,
          montoCentavos: cobro.montoCentavos,
        },
      );
    }

    /* 3. Al equipo: dinero que entró, igual que en cada venta con tarjeta. */
    await correos.correoAvisoAlEquipo({
      asunto: `Cobro por enlace pagado · ${cobro.referencia}`,
      lineas: [
        `${duenno?.nombre ?? cobro.tiendaId} · ${(cobro.montoCentavos / 100).toFixed(2)} USD · tarjeta · ${cobro.referencia}`,
        `Neto al comercio: ${(neto / 100).toFixed(2)} USD`,
      ],
      url: "https://mercatren.com/es/panel/cobros/enlaces",
      boton: "Ver los enlaces de cobro",
    });
  } catch (fallo) {
    console.error("[cobro] acreditado; el aviso no salio:", fallo);
  }

  /* Y se le avisa a SU SISTEMA, si dejó una dirección. Va al final y en su
     propio try: el cobro ya está acreditado y un servidor ajeno que no
     conteste no puede deshacerlo. */
  try {
    const { avisarAlComercio } = await import("@/lib/cobros/aviso-al-comercio");
    await avisarAlComercio({
      tiendaId: cobro.tiendaId,
      referencia: cobro.referencia,
      metodo: "tarjeta",
      montoCentavos: cobro.montoCentavos,
      netoCentavos: neto,
      moneda: "USD",
      pagoId: intentoId,
    });
  } catch (fallo) {
    console.error("[cobro] no se pudo avisar al sistema del comercio:", fallo);
  }
}

/**
 * EL PAGO POR ZELLE DE UN COBRO: la captura entra a la MISMA cola que todo.
 *
 * ══ NO EXIGE SESIÓN, IGUAL QUE PAGAR CON TARJETA ══
 *
 * El secreto del enlace es lo que autoriza, porque quien paga muchas veces no
 * tiene cuenta ni quiere tenerla. Todo lo demás se comprueba aquí, en el
 * servidor: la forma del enlace, el archivo, que el cobro siga pagable y que
 * esa tienda tenga Zelle habilitado con este monto.
 *
 * ══ EL NÚMERO DE CONCILIACIÓN VA AMARRADO AL PAGO ══
 *
 * La conciliación bancaria de Mercatren LLC es estricta: cada transferencia
 * del extracto tiene que cuadrar con su cobro. Por eso el concepto que el
 * pagador debe escribir en su Zelle («Mercatren F-00123») queda escrito
 * también en las notas del pago, y el validador lo tiene delante al comparar
 * contra el banco.
 *
 * Devuelve CLAVES, no frases: la página traduce al idioma de quien mira.
 */
export type ResultadoComprobanteCobro =
  | { ok: true }
  | {
      ok: false;
      motivo:
        | "enlace_invalido"
        | "no_pagable"
        | "zelle_no_disponible"
        | "ya_en_revision"
        | "sin_captura"
        | "captura_invalida"
        | "captura_pesada"
        | "no_se_pudo";
    };

const TIPOS_CAPTURA = ["image/jpeg", "image/png", "image/webp"];
const CAPTURA_MAXIMA = 8 * 1024 * 1024; // 8 MB

export async function subirComprobanteDeCobro(
  formulario: FormData,
): Promise<ResultadoComprobanteCobro> {
  const revisado = revisar(idDeRegistro, formulario.get("enlace"));
  if (!revisado.ok) return { ok: false, motivo: "enlace_invalido" };
  const enlace = revisado.datos;

  const captura = formulario.get("captura");
  const codigo = String(formulario.get("codigo") ?? "")
    .trim()
    .slice(0, 60);

  if (!(captura instanceof File) || captura.size === 0) {
    return { ok: false, motivo: "sin_captura" };
  }
  /* El comprobante NO se comprime ni se transforma: un validador tiene que
     leer el monto y la referencia del banco, y eso es dinero. */
  if (!TIPOS_CAPTURA.includes(captura.type)) {
    return { ok: false, motivo: "captura_invalida" };
  }
  if (captura.size > CAPTURA_MAXIMA) {
    return { ok: false, motivo: "captura_pesada" };
  }

  const db = getDb();

  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      tiendaId: cobrosSolicitados.tiendaId,
      montoCentavos: cobrosSolicitados.montoCentavos,
      estado: cobrosSolicitados.estado,
      venceEn: cobrosSolicitados.venceEn,
      referencia: cobrosSolicitados.referencia,
      contactoCorreo: cobrosSolicitados.contactoCorreo,
      contactoNombre: cobrosSolicitados.contactoNombre,
    })
    .from(cobrosSolicitados)
    .where(eq(cobrosSolicitados.enlace, enlace))
    .limit(1);

  if (!cobro) return { ok: false, motivo: "enlace_invalido" };
  if (!sePuedePagar(cobro.estado as EstadoCobro, cobro.venceEn, new Date())) {
    return { ok: false, motivo: "no_pagable" };
  }

  /* La disponibilidad se comprueba EN EL SERVIDOR, no confiando en que la
     página solo dibuja el botón cuando toca: un botón dibujado se lo salta
     cualquiera, y del otro lado hay una cola de validación con gente. */
  const { zelleDelCobro, comprobantePendienteDeCobro } =
    await import("@/lib/cobros/consultas");
  const zelle = await zelleDelCobro(cobro.tiendaId, cobro.montoCentavos);
  if (!zelle.disponible) return { ok: false, motivo: "zelle_no_disponible" };

  if (await comprobantePendienteDeCobro(cobro.id)) {
    return { ok: false, motivo: "ya_en_revision" };
  }

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const { RUTA_MEDIA } = await import("@/lib/rutas");
    const { huellaDelArchivo } = await import("@/lib/zelle/alertas");
    const { conceptoDelPago } = await import("@/lib/pedidos/concepto");
    const { calcularComisionCentavos, COMISION_ZELLE_PB } =
      await import("@/lib/dinero");
    const { pagosZelle, cobrosZelle } = await import("@/lib/db/schema");

    const extension =
      captura.name.split(".").pop()?.toLowerCase().slice(0, 5) || "jpg";
    const clave = `comprobantes/${cobro.id}/${nanoid()}.${extension}`;
    const contenido = await captura.arrayBuffer();
    await env.BUCKET.put(clave, contenido, {
      httpMetadata: { contentType: captura.type },
    });

    const comisionCentavos = calcularComisionCentavos(
      cobro.montoCentavos,
      COMISION_ZELLE_PB,
    );

    const ahora = new Date();
    const pagoId = nanoid();

    await db.insert(pagosZelle).values({
      id: pagoId,
      origen: "live",
      tipo: "entrada",
      estado: "pendiente",
      montoCentavos: cobro.montoCentavos,
      comisionCentavos,
      netoCentavos: cobro.montoCentavos - comisionCentavos,
      moneda: "USD",
      reciboUrl: `${RUTA_MEDIA}/${clave}`,
      subidoEn: ahora,
      codigoConfirmacion: codigo || null,
      pagadorNombre: cobro.contactoNombre,
      pagadorCorreo: cobro.contactoCorreo,
      pagadorTipo: "persona",
      cuentaReceptora: env.ZELLE_CORREO_RECEPTOR ?? null,
      plataforma: "zelle",
      /* Sin pedido, a propósito: la venta ya ocurrió en el mostrador del
         comercio. El puente con el cobro va en `cobros_zelle`. */
      pedidoId: null,
      tiendaId: cobro.tiendaId,
      /* El concepto de conciliación, delante del validador: es lo que debe
         aparecer en la nota de la transferencia que busca en el banco. */
      notas: `Cobro por enlace · ${conceptoDelPago(cobro.referencia)}`,
      creadoEn: ahora,
    });

    await db
      .insert(cobrosZelle)
      .values({ pagoZelleId: pagoId, cobroId: cobro.id });

    /* La huella en su propio try, como en los pedidos: si fallara, el
       comprobante entra igual y el candado del código repetido sigue vivo. */
    try {
      const { huellasComprobante } = await import("@/lib/db/schema");
      await db.insert(huellasComprobante).values({
        pagoId,
        huella: await huellaDelArchivo(contenido),
      });
    } catch (fallo) {
      console.error("[cobro] no se pudo guardar la huella:", fallo);
    }

    // Al pagador: recibimos tu captura, la está mirando una persona.
    try {
      const { correoComprobanteDeCobroRecibido } =
        await import("@/lib/correo/correos");
      await correoComprobanteDeCobroRecibido(
        {
          email: cobro.contactoCorreo,
          name: cobro.contactoNombre ?? "",
          idioma: "es",
        },
        { referencia: cobro.referencia, montoCentavos: cobro.montoCentavos },
      );
    } catch (fallo) {
      console.error("[cobro] comprobante subido; el correo no salio:", fallo);
    }

    // Y al equipo: hay una captura nueva esperando en la cola.
    try {
      const { correoAvisoComprobante } = await import("@/lib/correo/correos");
      await correoAvisoComprobante(cobro.referencia);
    } catch (fallo) {
      console.error("[cobro] comprobante subido; el aviso no salio:", fallo);
    }

    return { ok: true };
  } catch (fallo) {
    console.error("[cobro] no se pudo guardar el comprobante:", fallo);
    return { ok: false, motivo: "no_se_pudo" };
  }
}
