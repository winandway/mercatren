import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { modoPedido } from "@/lib/cobros/presentacion";
import { getDb } from "@/lib/db";
import {
  cobrosCadena,
  cobrosSolicitados,
  sociosTienda,
  tiendas,
  user,
} from "@/lib/db/schema";
import {
  generarEnlace,
  revisarPeticion,
  venceEn,
  type PeticionDeCobro,
} from "@/lib/cobros/reglas";
import {
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";

/**
 * COBRAR POR MERCATREN DESDE EL SISTEMA DEL COMERCIO.
 *
 * La cajera de la ferretería hace su factura como todos los días y toca un
 * botón. Su sistema llama aquí, y **el correo con el enlace de pago sale solo**
 * en ese mismo momento. Nadie del equipo del comercio tiene que mandar nada,
 * ni buscar el teléfono de nadie, ni avisar que lo mandó.
 *
 *   POST /datos/socios/cobro
 *   Authorization: Bearer <token de la tienda>
 *   { "monto": 45.90, "referencia": "F-00123",
 *     "correo": "cliente@…", "nombre": "…", "concepto": "…",
 *     "dias": 7 }
 *
 * ══ EL PLAZO LO DECIDE EL COMERCIO ══
 *
 * `dias` es opcional: por defecto **7**, hasta **15**. Antes eran 48 horas
 * fijas y estaba mal — en un abono de una ferretería del interior de Venezuela
 * la cadena es de tres personas y quien paga muchas veces tiene que hablar con
 * un familiar en Estados Unidos. Tardan hasta una semana.
 *
 * Lo que se pase de 15 se recorta al máximo en vez de rechazar el cobro: quien
 * pide 30 días quiere que dure mucho, no que su venta se caiga por un número.
 *
 * ══ Y CUANDO EL QUE PAGA NO CONOCE AL COMERCIO ══
 *
 * Tres campos más, **todos opcionales** para que lo de siempre siga
 * funcionando sin tocar una línea del otro lado:
 *
 *   "modo": "solo_mercatren"      ← la página NO nombra al comercio
 *   "referencia_deuda": "D-0099"  ← cómo llama el comercio a esa deuda
 *   "deudor": "Ferretería B"      ← quién debe, para el rastro interno
 *
 * El caso: Bley le fía a la Ferretería B y quien paga es un cliente de la
 * Ferretería B. Ese cliente le compró a B, no a Bley — y en su pantalla no
 * puede salir ninguno de los dos. Nombrar a Bley le enseña un negocio ajeno;
 * nombrar a B le cuenta a su propio cliente a quién le compra y cuánto le
 * debe. Solo se ve Mercatren, que es quien cobra y quien factura.
 *
 * `deudor` **no sale a ninguna pantalla**: se guarda para poder demostrar
 * quién pagó por cuenta de qué deuda si meses después hay un contracargo.
 *
 * Devuelve el enlace, para que el sistema del comercio lo pueda guardar contra
 * su factura y enseñarlo en pantalla si hace falta.
 *
 * ══ EL MONTO LLEGA EN DÓLARES Y SE GUARDA EN CENTAVOS ══
 *
 * Los sistemas de los comercios trabajan en dólares con decimales; aquí todo
 * el dinero es entero. La conversión va con `toPrecision` porque `45.90 * 100`
 * da 4589.999999999999 en coma flotante, y ese centavo perdido aparece
 * después en una factura que no cuadra.
 *
 * ══ SI EL CORREO NO SALE, EL COBRO NO SE DESHACE ══
 *
 * El enlace queda creado y el sistema del comercio lo recibe igual. Perder un
 * correo es molesto; perder el cobro después de que la cajera ya despachó al
 * cliente es mucho peor.
 */

/** `45.90` → `4590`, sin perder el centavo por el camino. */
function aCentavos(valor: number): number {
  return Math.round(Number((valor * 100).toPrecision(12)));
}

function error(estado: number, clave: string, extra?: unknown) {
  return Response.json({ error: clave, ...(extra ?? {}) }, { status: estado });
}

export async function POST(peticion: Request) {
  const token = tokenDeLaPeticion(peticion);
  if (!token) return error(401, "sin_token");

  let cuerpo: Record<string, unknown>;
  try {
    cuerpo = (await peticion.json()) as Record<string, unknown>;
  } catch {
    return error(400, "cuerpo_invalido");
  }

  const db = getDb();

  /* Qué tienda es. El token se guarda hasheado, así que se busca por hash y
     se compara en tiempo constante: comparar con `===` corta en la primera
     letra distinta y eso deja adivinar el token letra por letra. */
  const hash = await hashDeToken(token);
  const [vinculo] = await db
    .select({
      tiendaId: sociosTienda.tiendaId,
      tokenHash: sociosTienda.tokenHash,
    })
    .from(sociosTienda)
    .where(eq(sociosTienda.tokenHash, hash))
    .limit(1);

  if (!vinculo || !igualesEnTiempoConstante(vinculo.tokenHash, hash)) {
    return error(401, "token_invalido");
  }

  const [tienda] = await db
    .select({ id: tiendas.id, nombre: tiendas.nombre, estado: tiendas.estado })
    .from(tiendas)
    .where(eq(tiendas.id, vinculo.tiendaId))
    .limit(1);

  if (!tienda || tienda.estado !== "activa") {
    return error(403, "comercio_inactivo");
  }

  const datos: Partial<PeticionDeCobro> = {
    montoCentavos:
      typeof cuerpo.monto === "number"
        ? aCentavos(cuerpo.monto)
        : Number(cuerpo.monto_centavos),
    referencia: String(cuerpo.referencia ?? "").trim(),
    correo: String(cuerpo.correo ?? "")
      .trim()
      .toLowerCase(),
    nombre: cuerpo.nombre ? String(cuerpo.nombre).trim() : undefined,
  };

  /* Se devuelve la lista COMPLETA de lo que está mal, no el primer fallo. Del
     otro lado hay un programador integrando: decirle los problemas de uno en
     uno le cuesta una tarde, y eso ya pasó con otra integración. */
  const fallos = revisarPeticion(datos);
  if (fallos.length > 0)
    return error(400, "peticion_invalida", { campos: fallos });

  /* Lo que no se entiende cae en el modo NORMAL, nunca en el callado: un dato
     mal escrito que quitara el nombre del comercio haría que un cobro
     corriente dejara de pagarse sin que nadie supiera por qué. */
  const modo = modoPedido(cuerpo.modo);
  const referenciaDeuda = cuerpo.referencia_deuda
    ? String(cuerpo.referencia_deuda).trim().slice(0, 120)
    : null;
  const deudorNombre = cuerpo.deudor
    ? String(cuerpo.deudor).trim().slice(0, 160)
    : null;

  /**
   * LA CUENTA DEL CLIENTE SE ABRE SOLA.
   *
   * Quien va a pagar no tiene por qué registrarse antes: eso es justo el paso
   * donde se pierde la venta. Si ya tenía cuenta se reutiliza; si no, se crea
   * con el correo de la factura y sin contraseña — entra por el enlace, y si
   * algún día quiere entrar por su cuenta usa «olvidé mi clave».
   */
  const [existente] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, datos.correo!))
    .limit(1);

  let clienteId: string | null = existente?.id ?? null;

  if (!clienteId) {
    clienteId = `cli-${nanoid(16)}`;
    try {
      await db.insert(user).values({
        id: clienteId,
        email: datos.correo!,
        name: datos.nombre || datos.correo!.split("@")[0]!,
        emailVerified: false,
        rol: "cliente",
        idioma: "es",
      });
    } catch (fallo) {
      /* Si la cuenta no se puede crear, el cobro sigue: se paga igual desde el
         enlace. Bloquear un cobro por un problema de alta sería perder la
         venta por algo que no le importa a quien está pagando. */
      console.error("[cobro] no se pudo abrir la cuenta:", fallo);
      clienteId = null as string | null;
    }
  }

  const ahora = new Date();
  const enlace = generarEnlace();
  const id = `cobro-${nanoid(14)}`;
  /* Se calcula UNA vez y se usa en los dos sitios. Calcularlo aparte para la
     respuesta hacía que dijera una fecha distinta de la guardada — y el sistema
     del comercio se guarda la de la respuesta. */
  const vence = venceEn(ahora, cuerpo.dias);

  await db.insert(cobrosSolicitados).values({
    id,
    tiendaId: tienda.id,
    enlace,
    referencia: datos.referencia!,
    montoCentavos: datos.montoCentavos!,
    estado: "abierto",
    clienteId,
    contactoCorreo: datos.correo!,
    contactoNombre: datos.nombre ?? null,
    concepto: cuerpo.concepto ? String(cuerpo.concepto).slice(0, 300) : null,
    venceEn: vence,
    creadoEn: ahora,
  });

  /**
   * LA FILA DE CADENA SOLO SE ESCRIBE SI HACE FALTA.
   *
   * Un cobro normal no la lleva, y su ausencia significa exactamente «modo de
   * siempre». Así los cientos de cobros que ya existen se comportan igual sin
   * tocar nada.
   *
   * Va en su propio `try`: el cobro ya está creado y el enlace ya se puede
   * pagar. Perder el modo es feo — saldría el nombre del comercio donde no
   * debía— pero perder el cobro después de que la cajera ya despachó es peor.
   */
  if (modo !== "comercio" || referenciaDeuda || deudorNombre) {
    try {
      await db.insert(cobrosCadena).values({
        cobroId: id,
        modo,
        referenciaDeuda,
        deudorNombre,
        creadoEn: ahora,
      });
    } catch (fallo) {
      console.error("[cobro] no se pudo guardar el modo de cadena:", fallo);
    }
  }

  const url = `${new URL(peticion.url).origin}/es/cobro/${enlace}`;

  // El correo va en su propio try: el cobro ya está creado y se paga igual.
  try {
    const { correoEnlaceDeCobro } = await import("@/lib/correo/correos");
    await correoEnlaceDeCobro(
      { email: datos.correo!, name: datos.nombre ?? "", idioma: "es" },
      {
        comercio: tienda.nombre,
        nombrarComercio: modo !== "solo_mercatren",
        referencia: datos.referencia!,
        montoCentavos: datos.montoCentavos!,
        url,
      },
    );
  } catch (fallo) {
    console.error("[cobro] creado; el correo no salio:", fallo);
  }

  return Response.json({
    id,
    enlace,
    url,
    estado: "abierto",
    vence_en: vence.toISOString(),
    monto_centavos: datos.montoCentavos,
  });
}

/**
 * ¿YA PAGARON?
 *
 *   GET /datos/socios/cobro?referencia=F-00123
 *   GET /datos/socios/cobro?id=cobro-…
 *
 * Es lo que hace que la factura del comercio se marque pagada sola: su sistema
 * pregunta por el cobro y, cuando dice `pagado`, la cierra. Se puede preguntar
 * por el número de factura de ellos, que es el dato que ya tienen a mano.
 */
export async function GET(peticion: Request) {
  const token = tokenDeLaPeticion(peticion);
  if (!token) return error(401, "sin_token");

  const db = getDb();
  const hash = await hashDeToken(token);

  const [vinculo] = await db
    .select({ tiendaId: sociosTienda.tiendaId })
    .from(sociosTienda)
    .where(eq(sociosTienda.tokenHash, hash))
    .limit(1);

  if (!vinculo) return error(401, "token_invalido");

  const url = new URL(peticion.url);
  const id = url.searchParams.get("id");
  const referencia = url.searchParams.get("referencia");

  if (!id && !referencia) return error(400, "falta_id_o_referencia");

  /* SIEMPRE filtrado por la tienda del token: sin eso, un comercio podría
     preguntar por la factura de otro sabiendo su número. */
  const [cobro] = await db
    .select({
      id: cobrosSolicitados.id,
      referencia: cobrosSolicitados.referencia,
      estado: cobrosSolicitados.estado,
      montoCentavos: cobrosSolicitados.montoCentavos,
      venceEn: cobrosSolicitados.venceEn,
      pagadoEn: cobrosSolicitados.pagadoEn,
      pagoId: cobrosSolicitados.pagoId,
      enlace: cobrosSolicitados.enlace,
    })
    .from(cobrosSolicitados)
    .where(
      and(
        eq(cobrosSolicitados.tiendaId, vinculo.tiendaId),
        id
          ? eq(cobrosSolicitados.id, id)
          : eq(cobrosSolicitados.referencia, referencia!),
      ),
    )
    .limit(1);

  if (!cobro) return error(404, "no_existe");

  const { estadoParaMostrar } = await import("@/lib/cobros/reglas");
  const estado = estadoParaMostrar(cobro.estado, cobro.venceEn, new Date());

  /**
   * CON QUÉ SE PAGÓ, Y SI HAY UNA CAPTURA ESPERANDO.
   *
   * El sistema del comercio necesita las dos cosas: el método para su propia
   * contabilidad (la conciliación de allá también existe), y `en_revision`
   * para poder decirle a su cajera «el pago está en revisión» en vez de un
   * «sin pagar» que no cuenta la historia completa.
   *
   * El método se deduce del identificador guardado al pagarse: un `pi_…` solo
   * lo emite Stripe; cualquier otro es el id del pago Zelle aprobado.
   */
  const metodo =
    estado === "pagado" && cobro.pagoId
      ? cobro.pagoId.startsWith("pi_")
        ? "tarjeta"
        : "zelle"
      : null;

  let enRevision = false;
  if (estado === "abierto") {
    const { comprobantePendienteDeCobro } =
      await import("@/lib/cobros/consultas");
    enRevision = await comprobantePendienteDeCobro(cobro.id).catch(() => false);
  }

  return Response.json({
    id: cobro.id,
    referencia: cobro.referencia,
    // El vencimiento se calcula: un estado guardado se queda viejo.
    estado,
    metodo,
    en_revision: enRevision,
    monto_centavos: cobro.montoCentavos,
    pagado_en: cobro.pagadoEn?.toISOString() ?? null,
    url: `${url.origin}/es/cobro/${cobro.enlace}`,
  });
}
