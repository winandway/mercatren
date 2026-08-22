"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";

import { obtenerAlcance } from "@/lib/autorizacion";
import {
  cargosAGuardar,
  revisarCargos,
  totalDelCobro,
} from "@/lib/cobros/cargos";
import { modoPedido } from "@/lib/cobros/presentacion";
import {
  generarEnlace,
  revisarPeticion,
  venceEn,
  type PeticionDeCobro,
} from "@/lib/cobros/reglas";
import { getDb } from "@/lib/db";
import {
  cargosCobro,
  cobrosCadena,
  cobrosSolicitados,
  tiendas,
  user,
} from "@/lib/db/schema";
import { aCentavos } from "@/lib/retiros/monto";
import { SITIO } from "@/lib/sitio";

/**
 * PEDIR UN COBRO DESDE EL PANEL, SIN API — Y REENVIARLO A UN TERCERO.
 *
 * ══ POR QUÉ ESTO FALTABA ══
 *
 * El cobro por enlace existía **solo por API**, así que solo lo tenía el único
 * comercio con un programador que la integró. Los demás abrían «Enlaces de
 * cobro», la veían vacía para siempre, y no había un solo botón para crear uno.
 *
 * Y el caso que lo pedía es el más común de todos: **quien paga no es el
 * cliente**. Alguien compra en el mostrador de Valencia y el que pone la
 * tarjeta es su hijo en Miami. El comercio necesita un enlace que se pueda
 * REENVIAR, no una factura a nombre de quien no va a pagar.
 *
 * ══ ES LA MISMA MECÁNICA QUE LA API, POR OTRA PUERTA ══
 *
 * Mismo `revisarPeticion`, mismo `venceEn`, mismo `generarEnlace`, misma tabla
 * y mismo correo. Lo único que cambia es de dónde sale la tienda: aquí del
 * ALCANCE de la sesión, allá del token del socio.
 *
 * Va en su propio archivo y no en `cobros/acciones.ts` a propósito: ese es el
 * lado de PAGAR un cobro —el intento de Stripe, la acreditación, el
 * comprobante— y este es el de PEDIRLO. Juntarlos haría un archivo donde el
 * dinero entra y sale en la misma pantalla de código.
 */

export type ResultadoCobro =
  | { ok: true; url: string; referencia: string }
  | { ok: false; mensaje: string; campos?: string[] };

export async function crearCobroDesdePanel(
  _previo: unknown,
  datos: FormData,
): Promise<ResultadoCobro> {
  /* Con `.catch`: una cuenta sin comercio asignado lanza, y una acción que
     lanza le revienta el formulario sin decir por qué. */
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) {
    return { ok: false, mensaje: "Tu sesión no tiene permiso para cobrar." };
  }

  /**
   * DE QUÉ COMERCIO ES ESTE COBRO.
   *
   * Si quien pide es un comercio, el suyo y solo el suyo. Si es el equipo,
   * tiene que decir cuál — y **no se adivina**: un cobro creado para el
   * comercio equivocado le acredita el dinero a otro.
   */
  let tiendaId: string;
  if (alcance.tipo === "tienda") {
    tiendaId = alcance.tiendaId;
  } else {
    const pedida = String(datos.get("tiendaId") ?? "").trim();
    if (!pedida) {
      return { ok: false, mensaje: "Elige de qué comercio es este cobro." };
    }
    tiendaId = pedida;
  }

  const db = getDb();
  const [tienda] = await db
    .select({ id: tiendas.id, nombre: tiendas.nombre, estado: tiendas.estado })
    .from(tiendas)
    .where(eq(tiendas.id, tiendaId))
    .limit(1);

  if (!tienda) return { ok: false, mensaje: "Ese comercio no existe." };
  if (tienda.estado !== "activa") {
    return {
      ok: false,
      mensaje: "Este comercio no está activo, así que no puede cobrar.",
    };
  }

  const texto = (clave: string) => String(datos.get(clave) ?? "").trim();

  /**
   * LA MERCANCÍA Y LOS CARGOS VAN SEPARADOS.
   *
   * El monto que escribe el comercio es el de LO QUE VENDIÓ. El flete y el
   * manejo se suman aparte, y el total sale de la suma. Meterlo todo en un solo
   * número haría que la factura dijera que el cemento costó $600 cuando costó
   * $540 — y eso es un documento que dice algo falso.
   */
  const mercanciaCentavos = aCentavos(texto("monto")) ?? Number.NaN;

  const crudos = [
    {
      tipo: "flete" as const,
      concepto: texto("fleteConcepto"),
      montoCentavos: texto("flete") ? aCentavos(texto("flete")) : null,
    },
    {
      tipo: "manejo" as const,
      concepto: texto("manejoConcepto"),
      montoCentavos: texto("manejo") ? aCentavos(texto("manejo")) : null,
    },
  ];

  const fallosDeCargo = revisarCargos(crudos);
  if (fallosDeCargo.length > 0) {
    return {
      ok: false,
      mensaje:
        "Revisa el flete o el manejo: tiene que ser un monto válido y no puede pasar de $5,000.",
      campos: fallosDeCargo,
    };
  }

  const cargos = cargosAGuardar(crudos);

  const peticion: Partial<PeticionDeCobro> = {
    /* Lo que se cobra —y lo que se compara contra el mínimo y el máximo— es el
       TOTAL, porque es lo que va a pagar la persona. */
    montoCentavos: Number.isFinite(mercanciaCentavos)
      ? totalDelCobro(mercanciaCentavos, cargos)
      : Number.NaN,
    referencia: texto("referencia"),
    correo: texto("correo").toLowerCase(),
    nombre: texto("nombre") || undefined,
  };

  /* La lista COMPLETA de lo que está mal, no el primer fallo: quien llena esto
     tiene un cliente delante y no puede corregir de uno en uno. */
  const fallos = revisarPeticion(peticion);
  if (fallos.length > 0) {
    return { ok: false, mensaje: "Revisa estos campos.", campos: fallos };
  }

  /* La cuenta de quien paga se abre sola. Pedirle registrarse antes de pagar es
     justo el paso donde se pierde la venta que esto viene a salvar. */
  const [existente] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, peticion.correo!))
    .limit(1);

  let clienteId: string | null = existente?.id ?? null;
  if (!clienteId) {
    clienteId = `cli-${nanoid(16)}`;
    try {
      await db.insert(user).values({
        id: clienteId,
        email: peticion.correo!,
        name: peticion.nombre || peticion.correo!.split("@")[0]!,
        emailVerified: false,
        rol: "cliente",
        idioma: "es",
      });
    } catch (fallo) {
      /* Si la cuenta no se puede abrir, el cobro sigue: se paga igual desde el
         enlace. Perder la venta por un problema de alta sería absurdo. */
      console.error("[cobro-panel] no se pudo abrir la cuenta:", fallo);
      clienteId = null;
    }
  }

  const ahora = new Date();
  const enlace = generarEnlace();
  const id = `cobro-${nanoid(14)}`;
  const dias = texto("dias");
  const vence = venceEn(ahora, dias ? Number(dias) : undefined);
  const concepto = texto("concepto");

  try {
    await db.insert(cobrosSolicitados).values({
      id,
      tiendaId: tienda.id,
      enlace,
      referencia: peticion.referencia!,
      montoCentavos: peticion.montoCentavos!,
      estado: "abierto",
      clienteId,
      contactoCorreo: peticion.correo!,
      contactoNombre: peticion.nombre ?? null,
      concepto: concepto ? concepto.slice(0, 300) : null,
      venceEn: vence,
      creadoEn: ahora,
    });
  } catch (fallo) {
    /* Repetir la referencia es el error más común, y hay que poder decirlo:
       un «no se pudo» a secas deja al comercio adivinando con el cliente
       delante. */
    console.error("[cobro-panel] no se pudo crear:", fallo);
    return {
      ok: false,
      mensaje:
        "No se pudo crear el cobro. Si ya usaste esa referencia antes, prueba con otra.",
    };
  }

  /**
   * LOS CARGOS, DESPUÉS DEL COBRO Y EN SU PROPIO `try`.
   *
   * El cobro ya existe y su monto YA lleva el flete dentro, así que si esto
   * falla no se pierde ni un centavo: lo que se pierde es el desglose en
   * pantalla. Tumbar un cobro ya creado por no poder escribir su detalle sería
   * mucho peor — la cajera ya despachó.
   */
  if (cargos.length > 0) {
    try {
      await db.insert(cargosCobro).values(
        cargos.map((c) => ({
          id: `cargo-${nanoid(12)}`,
          cobroId: id,
          tipo: c.tipo,
          concepto: c.concepto,
          montoCentavos: c.montoCentavos,
          creadoEn: ahora,
        })),
      );
    } catch (fallo) {
      console.error("[cobro-panel] no se guardó el desglose:", fallo);
    }
  }

  /* El modo callado, solo si lo pidieron. Su ausencia significa «el de
     siempre», así que los cobros que ya existen no cambian de comportamiento. */
  const modo = modoPedido(datos.get("modo"));
  if (modo !== "comercio") {
    try {
      await db.insert(cobrosCadena).values({
        cobroId: id,
        modo,
        referenciaDeuda: null,
        deudorNombre: null,
        creadoEn: ahora,
      });
    } catch (fallo) {
      console.error("[cobro-panel] no se guardó el modo:", fallo);
    }
  }

  const url = `${SITIO.url}/es/cobro/${enlace}`;

  /* El correo va en su propio try: el cobro YA existe y el enlace ya se puede
     pagar. Si el correo no sale, el comercio lo copia y lo manda por WhatsApp
     — que es como se manda de verdad la mayoría de las veces. */
  try {
    const { correoEnlaceDeCobro } = await import("@/lib/correo/correos");
    await correoEnlaceDeCobro(
      { email: peticion.correo!, name: peticion.nombre ?? "", idioma: "es" },
      {
        comercio: tienda.nombre,
        nombrarComercio: modo !== "solo_mercatren",
        referencia: peticion.referencia!,
        montoCentavos: peticion.montoCentavos!,
        url,
      },
    );
  } catch (fallo) {
    console.error("[cobro-panel] creado; el correo no salió:", fallo);
  }

  revalidatePath("/[locale]/panel/cobros/enlaces", "page");
  return { ok: true, url, referencia: peticion.referencia! };
}

/**
 * REENVIAR UN COBRO YA CREADO A OTRO CORREO.
 *
 * ══ ESTE ES EL CASO QUE LO PEDÍA ══
 *
 * El cobro se creó a nombre del cliente y quien va a pagar resulta ser otro: el
 * hijo, el socio, el familiar en Estados Unidos. Sin esto, el comercio tenía que
 * **anular y volver a crear** el cobro con otro correo — y eso le cambia la
 * referencia, que es justo lo que ensucia la conciliación bancaria.
 *
 * ══ EL ENLACE ES EL MISMO, Y ESO ES LO IMPORTANTE ══
 *
 * No se genera uno nuevo. El que ya circula sigue sirviendo, la referencia no
 * cambia, y en el extracto del banco sigue apareciendo el mismo número. Lo
 * único que pasa es que el correo sale otra vez, ahora a quien de verdad paga.
 */
export async function reenviarCobro(
  _previo: unknown,
  datos: FormData,
): Promise<{ ok: boolean; mensaje: string }> {
  const alcance = await obtenerAlcance().catch(() => null);
  if (!alcance) return { ok: false, mensaje: "Tu sesión no tiene permiso." };

  const cobroId = String(datos.get("cobroId") ?? "").trim();
  const correo = String(datos.get("correo") ?? "")
    .trim()
    .toLowerCase();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) {
    return { ok: false, mensaje: "Escribe un correo válido." };
  }

  const db = getDb();

  /* EL ALCANCE VA DENTRO DE LA BÚSQUEDA, no después: si el cobro es de otro
     comercio no aparece, así que nadie puede reenviar el enlace de un cobro
     ajeno escribiendo su id a mano. */
  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      enlace: cobrosSolicitados.enlace,
      referencia: cobrosSolicitados.referencia,
      montoCentavos: cobrosSolicitados.montoCentavos,
      estado: cobrosSolicitados.estado,
      venceEn: cobrosSolicitados.venceEn,
      tiendaNombre: tiendas.nombre,
    })
    .from(cobrosSolicitados)
    .leftJoin(tiendas, eq(tiendas.id, cobrosSolicitados.tiendaId))
    .where(
      and(
        eq(cobrosSolicitados.id, cobroId),
        alcance.tipo === "tienda"
          ? eq(cobrosSolicitados.tiendaId, alcance.tiendaId)
          : undefined,
      ),
    )
    .limit(1);

  if (!cobro) return { ok: false, mensaje: "No encontramos ese cobro." };

  /* UNO PAGADO NO SE REENVÍA: mandarle a alguien el enlace de algo que ya se
     pagó es invitarlo a pagarlo dos veces. */
  if (cobro.estado === "pagado") {
    return { ok: false, mensaje: "Ese cobro ya está pagado." };
  }
  if (cobro.estado === "cancelado") {
    return { ok: false, mensaje: "Ese cobro está cancelado." };
  }
  if (cobro.venceEn && cobro.venceEn.getTime() < Date.now()) {
    return {
      ok: false,
      mensaje: "Ese cobro venció. Reactívalo antes de reenviarlo.",
    };
  }

  /* Si el modo es callado, el correo tampoco nombra al comercio. Esa es la
     razón entera de que ese modo exista: quien paga no debe enterarse de quién
     le surte a la tienda donde compró. */
  const [cadena] = await db
    .select({ modo: cobrosCadena.modo })
    .from(cobrosCadena)
    .where(eq(cobrosCadena.cobroId, cobro.id))
    .limit(1)
    .catch(() => []);

  const url = `${SITIO.url}/es/cobro/${cobro.enlace}`;

  try {
    const { correoEnlaceDeCobro } = await import("@/lib/correo/correos");
    await correoEnlaceDeCobro(
      { email: correo, name: "", idioma: "es" },
      {
        comercio: cobro.tiendaNombre ?? "",
        nombrarComercio: cadena?.modo !== "solo_mercatren",
        referencia: cobro.referencia,
        montoCentavos: cobro.montoCentavos,
        url,
      },
    );
  } catch (fallo) {
    console.error("[cobro-panel] no se pudo reenviar:", fallo);
    return {
      ok: false,
      mensaje:
        "No se pudo enviar el correo. Copia el enlace y mándalo por WhatsApp.",
    };
  }

  return { ok: true, mensaje: `Enviado a ${correo}.` };
}
