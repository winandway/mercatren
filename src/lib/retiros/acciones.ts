"use server";

import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  exigirEquipoInterno,
  obtenerAlcance,
  obtenerUsuario,
} from "@/lib/autorizacion";
import { getDb } from "@/lib/db";
import { comprobantesRetiro } from "@/lib/db/schema";
import {
  limpiarCuenta,
  paisBancario,
  revisarCuenta,
} from "@/lib/retiros/paises";
import { aCentavos } from "@/lib/retiros/monto";
import { billeteras, retiros, tiendas } from "@/lib/db/schema";
import { mensajes } from "@/lib/mensajes";
import { comercioObservado } from "@/lib/soporte/ver-como";
import { obtenerPosicion } from "@/lib/zelle/billetera";

/**
 * Sacar el dinero de la billetera.
 *
 * CÓMO FUNCIONA DE VERDAD: esto no mueve dinero solo. El comercio pide, el
 * saldo se le aparta, alguien del equipo hace la transferencia en el banco a
 * mano y luego marca aquí que ya la hizo. El botón no paga: deja constancia.
 *
 * Se hace así a propósito mientras no esté conectado el WaaS de tokiia.com.
 * Un botón que dijera "pagar" y no pagara sería mucho peor que uno que dice
 * lo que hace.
 */

export type Resultado =
  { ok: true; mensaje: string } | { ok: false; mensaje: string };

/** Lo mínimo para que una transferencia se pueda hacer de verdad. */
type Textos = Awaited<ReturnType<typeof mensajes>>;

function esquema(t: Textos) {
  return z
    .object({
      monto: z
        .string()
        .trim()
        .min(1, t("faltaMonto"))
        .transform((v) => v.replace(/[^0-9.]/g, "")),
      /**
       * ZELLE YA NO ES UNA FORMA DE RETIRO, y no fue un recorte de alcance.
       *
       * El dinero de los comercios sale de la cuenta de Mercury, y **Mercury
       * no hace Zelle**: solo ACH dentro de Estados Unidos y wire para
       * afuera. Mientras estuvo en la lista, un comercio podía pedirlo y
       * quien iba al banco no lo podía ejecutar — una promesa que el sistema
       * no puede cumplir es peor que no ofrecerla.
       */
      forma: z.enum(["comercio", "ach", "wire"]),
      // Solo cuando la forma es `comercio`.
      destinoTiendaId: z.string().trim().optional(),
      /** El país de la cuenta. Decide qué datos se piden y cómo se manda. */
      pais: z.string().trim().max(2).optional(),
      /** Los campos bancarios, que cambian según el país. */
      cuentaJson: z.string().trim().max(2000).optional(),
      nota: z.string().trim().max(300).optional(),
    })
    .superRefine((d, ctx) => {
      const fallo = (mensaje: string) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: mensaje });

      if (d.forma === "comercio") {
        if (!d.destinoTiendaId) fallo(t("faltaComercioDestino"));
        return;
      }

      /**
       * LOS DATOS SE COMPRUEBAN CONTRA LAS REGLAS DEL PAÍS.
       *
       * Un wire internacional a una cuenta mal escrita no rebota al día
       * siguiente: se queda dando vueltas entre bancos, cuesta la comisión de
       * vuelta y puede tardar semanas. Comprobar que una CLABE tiene 18
       * dígitos es gratis; que el comercio se quede sin su dinero, no.
       */
      const pais = d.pais ?? "";
      if (!paisBancario(pais)) {
        fallo(t("faltaPais"));
        return;
      }

      let valores: Record<string, string> = {};
      try {
        valores = JSON.parse(d.cuentaJson || "{}") as Record<string, string>;
      } catch {
        fallo(t("revisaCampos"));
        return;
      }

      if (revisarCuenta(pais, valores).length > 0) fallo(t("revisaCampos"));
    });
}

/**
 * El comercio pide su dinero.
 *
 * SE COMPRUEBA CONTRA LO DISPONIBLE, no contra el saldo: lo que ya pidió y
 * todavía no le hemos mandado está apartado. Sin eso, con $2,000 podría pedir
 * $1,000 tres veces y le acabaríamos debiendo dinero que nunca tuvo.
 */
export async function pedirRetiro(
  _previo: unknown,
  datos: FormData,
): Promise<Resultado> {
  const t = await mensajes();

  /**
   * MIRANDO NO SE PIDE DINERO.
   *
   * Soporte puede ver el panel con los ojos de un comercio para poder
   * responderle, pero ese modo es **solo para ver**. Sin este candado, el
   * alcance prestado dejaría pedir un retiro en nombre de otro sin que nadie
   * se enterara, que es exactamente lo que se quería evitar.
   */
  if (await comercioObservado()) {
    return { ok: false, mensaje: t("soloMirando") };
  }

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("soloComercio") };

  // El equipo puede pedir en nombre de un comercio (soporte lo hace por
  // teléfono), pero tiene que decir cuál; un vendedor, solo el suyo.
  const tiendaId =
    alcance.tipo === "tienda"
      ? alcance.tiendaId
      : String(datos.get("tiendaId") ?? "");

  if (!tiendaId) return { ok: false, mensaje: t("tiendaSinIdentificar") };

  const revisado = esquema(t).safeParse(
    Object.fromEntries(datos) as Record<string, string>,
  );

  if (!revisado.success) {
    return {
      ok: false,
      mensaje: revisado.error.issues[0]?.message ?? t("revisaLosDatos"),
    };
  }

  const d = revisado.data;
  const montoCentavos = aCentavos(d.monto);

  if (montoCentavos === null || montoCentavos <= 0) {
    return { ok: false, mensaje: t("montoInvalido") };
  }

  const posicion = await obtenerPosicion(tiendaId);
  if (!posicion) return { ok: false, mensaje: t("sinBilletera") };

  if (montoCentavos > posicion.disponibleCentavos) {
    return { ok: false, mensaje: t("montoMayorAlDisponible") };
  }

  // El comercio destino tiene que existir, estar activo y no ser el mismo.
  let destinoTiendaId: string | null = null;
  if (d.forma === "comercio") {
    if (d.destinoTiendaId === tiendaId) {
      return { ok: false, mensaje: t("destinoEsElMismo") };
    }

    const db = getDb();
    const [destino] = await db
      .select({ id: tiendas.id })
      .from(tiendas)
      .where(
        and(
          eq(tiendas.id, String(d.destinoTiendaId)),
          eq(tiendas.estado, "activa"),
        ),
      )
      .limit(1);

    if (!destino) return { ok: false, mensaje: t("comercioDestinoNoExiste") };
    destinoTiendaId = destino.id;
  }

  const usuario = await obtenerUsuario();
  const db = getDb();

  await db.insert(retiros).values({
    id: `retiro-${nanoid(12)}`,
    tiendaId,
    solicitadoPorId: usuario?.id ?? null,
    montoCentavos,
    estado: "solicitado",
    forma: d.forma,
    destinoTiendaId,
    // Se guarda tal como está hoy: si mañana cambia de banco, este retiro
    // tiene que seguir diciendo a dónde se mandó de verdad.
    /* Se guarda LIMPIO —sin espacios, los códigos en mayúsculas— porque es
       lo que alguien va a copiar y pegar en Mercury. Un IBAN con un espacio
       de más pegado en el formulario del banco es una transferencia
       rechazada. Y con el país adentro, para saber por qué vía salió. */
    destino:
      d.forma === "comercio"
        ? null
        : {
            pais: d.pais,
            ...limpiarCuenta(d.pais!, JSON.parse(d.cuentaJson || "{}")),
          },
    notaComercio: d.nota || null,
  });

  revalidatePath("/[locale]/panel", "layout");

  /**
   * EL EQUIPO SE ENTERA SIN ENTRAR AL PANEL. Aquí no hay nada automático: la
   * transferencia la hace una persona en el banco. Si nadie mira la cola,
   * nadie transfiere, y el comercio se queda esperando un dinero que ya es
   * suyo. El aviso nunca deshace la solicitud: si el correo falla, el cobro
   * queda pedido igual.
   */
  try {
    const { correoAvisoRetiroSolicitado } =
      await import("@/lib/correo/correos");
    const { nombreDeTienda } = await import("@/lib/correo/contactos");
    await correoAvisoRetiroSolicitado({
      comercio: await nombreDeTienda(tiendaId),
      montoCentavos,
      forma: d.forma,
    });
  } catch (e) {
    console.error("[retiro] pedido; aviso al equipo fallido:", e);
  }

  return { ok: true, mensaje: t("retiroPedido") };
}

/**
 * El equipo marca que ya hizo la transferencia.
 *
 * Aquí es donde el saldo baja de verdad. Solo se toca si el retiro sigue en
 * "solicitado": si otra persona del equipo lo marcó medio segundo antes, esta
 * llamada no hace nada y lo dice, en vez de pagar dos veces.
 */
export async function marcarRetiroPagado(
  id: string,
  referencia?: string,
  /**
   * LA CAPTURA DE LA TRANSFERENCIA, opcional.
   *
   * Una ACH tarda uno o dos días y un wire internacional más. En ese hueco el
   * comercio ve «pagado» en el panel y **nada en su cuenta**, y lo único que
   * puede hacer es escribir preguntando si de verdad se mandó. La captura
   * contesta esa pregunta antes de que la haga.
   *
   * Va como opcional a propósito: **un fallo al subir la imagen NUNCA puede
   * impedir que el retiro quede marcado**. El dinero ya salió del banco; que
   * el sistema no lo reconozca por una foto sería mucho peor que quedarse sin
   * la foto.
   */
  captura?: File | null,
): Promise<Resultado> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("soloEquipo") };
  }

  const db = getDb();
  const usuario = await obtenerUsuario();

  const [retiro] = await db
    .select({
      tiendaId: retiros.tiendaId,
      montoCentavos: retiros.montoCentavos,
      forma: retiros.forma,
      destinoTiendaId: retiros.destinoTiendaId,
    })
    .from(retiros)
    .where(and(eq(retiros.id, id), eq(retiros.estado, "solicitado")))
    .limit(1);

  if (!retiro) return { ok: false, mensaje: t("retiroYaResuelto") };

  const marcado = await db
    .update(retiros)
    .set({
      estado: "pagado",
      referencia: referencia?.trim() || null,
      resueltoPorId: usuario?.id ?? null,
      resueltoEn: new Date(),
    })
    .where(and(eq(retiros.id, id), eq(retiros.estado, "solicitado")))
    .returning({ id: retiros.id });

  if (marcado.length === 0) {
    return { ok: false, mensaje: t("retiroYaResuelto") };
  }

  /**
   * LA CAPTURA VA DESPUÉS DE MARCAR, Y EN SU PROPIO `try`.
   *
   * El orden importa: si se subiera antes y la marca fallara, quedaría un
   * comprobante de un retiro que el sistema sigue creyendo pendiente. Y si la
   * subida revienta, el retiro ya está marcado — que es lo que de verdad
   * importa, porque el dinero ya salió del banco.
   */
  if (captura instanceof File && captura.size > 0) {
    try {
      const { subirDocumento } = await import("@/lib/subidas");
      const subida = await subirDocumento(captura, `retiros/${id}`);
      if (subida.ok) {
        await db.insert(comprobantesRetiro).values({
          id: `compret-${nanoid(12)}`,
          retiroId: id,
          clave: subida.clave,
          subidoPorId: usuario?.id ?? null,
        });
      } else {
        console.error("[retiro] la captura no se pudo subir:", subida.mensaje);
      }
    } catch (e) {
      console.error("[retiro] pagado; la captura falló:", e);
    }
  }

  /**
   * Si va a otro comercio de Mercatren, el dinero no sale del sistema: hay que
   * abonárselo al que lo recibe. Se suma de forma relativa (saldo = saldo + X)
   * para que dos personas trabajando a la vez no se pisen el resultado.
   *
   * OJO: la billetera del que recibe es un espejo del proveedor y todavía no
   * está conectada; su posición real se sigue calculando de los pagos. Este
   * abono queda apuntado para cuando el WaaS sea la fuente de verdad.
   */
  if (retiro.forma === "comercio" && retiro.destinoTiendaId) {
    await db
      .update(billeteras)
      .set({
        saldoCentavos: sql`${billeteras.saldoCentavos} + ${retiro.montoCentavos}`,
      })
      .where(eq(billeteras.tiendaId, retiro.destinoTiendaId));
  }

  revalidatePath("/[locale]/panel", "layout");

  /**
   * "Ya salió del banco", al comercio y en su idioma. Sin este aviso, la
   * única forma de enterarse es mirar la cuenta o entrar al panel a
   * adivinar; con ACH tardando uno o dos días, eso son dos días de dudas.
   */
  try {
    const { correoRetiroPagado } = await import("@/lib/correo/correos");
    const { duennoDeTienda } = await import("@/lib/correo/contactos");
    const duenno = await duennoDeTienda(retiro.tiendaId);
    if (duenno) {
      await correoRetiroPagado(duenno, {
        montoCentavos: retiro.montoCentavos,
        referencia: referencia?.trim() || null,
      });
    }
  } catch (e) {
    console.error("[retiro] pagado; aviso al comercio fallido:", e);
  }

  return { ok: true, mensaje: t("retiroPagado") };
}

/**
 * El equipo no puede hacer la transferencia.
 *
 * El motivo es obligatorio: un retiro que vuelve sin explicación deja al
 * comercio llamando por teléfono a preguntar qué pasó. Al rechazarlo, el
 * dinero deja de estar apartado y vuelve a estar disponible.
 */
export async function rechazarRetiro(
  id: string,
  motivo: string,
): Promise<Resultado> {
  const t = await mensajes();

  try {
    await exigirEquipoInterno();
  } catch {
    return { ok: false, mensaje: t("soloEquipo") };
  }

  const limpio = motivo.trim();
  if (limpio.length < 4) return { ok: false, mensaje: t("faltaMotivo") };

  const db = getDb();
  const usuario = await obtenerUsuario();

  const marcado = await db
    .update(retiros)
    .set({
      estado: "rechazado",
      motivoRechazo: limpio,
      resueltoPorId: usuario?.id ?? null,
      resueltoEn: new Date(),
    })
    .where(and(eq(retiros.id, id), eq(retiros.estado, "solicitado")))
    .returning({
      id: retiros.id,
      tiendaId: retiros.tiendaId,
      montoCentavos: retiros.montoCentavos,
    });

  if (marcado.length === 0) {
    return { ok: false, mensaje: t("retiroYaResuelto") };
  }

  revalidatePath("/[locale]/panel", "layout");

  /**
   * El motivo viaja en el correo, no solo en la pantalla. Un cobro que vuelve
   * sin explicación deja al comercio llamando por teléfono a preguntar qué
   * pasó — y esa llamada la contesta una persona del equipo.
   */
  try {
    const { correoRetiroRechazado } = await import("@/lib/correo/correos");
    const { duennoDeTienda } = await import("@/lib/correo/contactos");
    const duenno = await duennoDeTienda(marcado[0].tiendaId);
    if (duenno) {
      await correoRetiroRechazado(
        duenno,
        { montoCentavos: marcado[0].montoCentavos },
        limpio,
      );
    }
  } catch (e) {
    console.error("[retiro] rechazado; aviso al comercio fallido:", e);
  }

  return { ok: true, mensaje: t("retiroRechazado") };
}

/**
 * El propio comercio se arrepiente.
 *
 * Solo mientras nadie lo haya tocado. Si ya se hizo la transferencia, el
 * dinero salió del banco y cancelarlo aquí no lo devuelve.
 */
export async function cancelarRetiro(id: string): Promise<Resultado> {
  const t = await mensajes();

  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: t("soloComercio") };

  const db = getDb();
  const usuario = await obtenerUsuario();

  const condiciones = [eq(retiros.id, id), eq(retiros.estado, "solicitado")];
  // Un comercio solo cancela los suyos.
  if (alcance.tipo === "tienda") {
    condiciones.push(eq(retiros.tiendaId, alcance.tiendaId));
  }

  const marcado = await db
    .update(retiros)
    /**
     * SE GUARDA QUIÉN LO CANCELÓ.
     *
     * Marcar pagado y rechazar ya lo guardaban; cancelar no. El resultado era
     * un retiro que decía «cancelado» y no había forma de saber si lo canceló
     * el comercio o alguien del equipo — que es exactamente la primera pregunta
     * cuando uno mira ese renglón semanas después.
     */
    .set({
      estado: "cancelado",
      resueltoEn: new Date(),
      resueltoPorId: usuario?.id ?? null,
    })
    .where(and(...condiciones))
    .returning({ id: retiros.id });

  if (marcado.length === 0) {
    return { ok: false, mensaje: t("retiroYaResuelto") };
  }

  revalidatePath("/[locale]/panel", "layout");
  return { ok: true, mensaje: t("retiroCancelado") };
}
