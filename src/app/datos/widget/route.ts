import { nanoid } from "nanoid";
import { z } from "zod";

import { crearCasillero } from "@/lib/casillero/crear";
import {
  avisarQueYaTieneCuenta,
  mandarDireccionPorCorreo,
} from "@/lib/casillero/correo-casillero";
import {
  dominioAutorizado,
  huellaDeIp,
  origenPorClave,
  seLePaso,
  SEGUNDOS_MINIMOS,
} from "@/lib/casillero/widget";
import { getDb } from "@/lib/db";
import { altasCasillero, user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * ══ EL ALTA DESDE OTRO SITIO ══
 *
 * La única entrada del sistema que escribe en la base **sin sesión**. Los
 * cuatro cerrojos viven en `widget.ts`; aquí se aplican en orden y se
 * responde sin dar pistas: un atacante no tiene por qué saber si falló la
 * clave, el dominio o el límite.
 *
 * ══ NUNCA SE DEVUELVE EL CÓDIGO NI LA DIRECCIÓN (corregido 9 sep 2026) ══
 *
 * La primera versión los devolvía en la misma respuesta, **y era un agujero
 * grave**: cualquiera escribía el correo de otra persona y se llevaba SU
 * código de casillero, que es lo único que hace falta para mandar cajas a
 * su nombre o para reclamar las suyas. De paso, la respuesta decía si ese
 * correo tenía cuenta.
 *
 * Ahora la respuesta es **siempre la misma** —«te mandamos un correo»— y el
 * dato viaja al buzón, que es la única prueba de que quien lo pide es el
 * dueño de esa dirección. Es la regla que ya rige la recuperación de
 * contraseña de este proyecto: la pantalla nunca dice si el correo existe.
 *
 * Y si el correo YA tiene cuenta, **no se toca esa cuenta**: no se le
 * escribe el nombre ni el teléfono que mandó quien sea, no se le crea
 * casillero. Se le avisa al dueño y él decide.
 */
const Peticion = z.object({
  clave: z.string().min(3).max(80),
  nombreLegal: z.string().min(5).max(120),
  email: z.string().email().max(160),
  telefono: z.string().min(7).max(40),
  paisDestino: z.string().length(2),
  terminos: z.literal(true),
  /* La trampa: un campo que una persona no ve y un robot rellena. */
  web: z.string().max(0).optional(),
  /* Cuánto tardó en llenarlo, en segundos. */
  segundos: z.number().min(0).max(86_400).optional(),
});

const no = (motivo: string, estado = 400) =>
  Response.json({ ok: false, motivo }, { status: estado });

export async function POST(peticion: Request) {
  const crudo = await peticion.json().catch(() => null);
  const entrada = Peticion.safeParse(crudo);
  if (!entrada.success) return no("datos");
  const e = entrada.data;

  /* 1 · La clave existe y está encendida. */
  const origen = await origenPorClave(e.clave);
  if (!origen) return no("clave", 403);

  /* 2 · Y viene del sitio para el que se emitió. */
  const cabecera =
    peticion.headers.get("origin") ?? peticion.headers.get("referer");
  if (!dominioAutorizado(cabecera, origen.dominio)) return no("origen", 403);

  /* 3 · La trampa y el reloj: los robots baratos caen aquí. */
  if (e.web) return no("bot", 400);
  if (typeof e.segundos === "number" && e.segundos < SEGUNDOS_MINIMOS) {
    return no("bot", 400);
  }

  /* 4 · El límite por IP y clave. */
  const ip =
    peticion.headers.get("cf-connecting-ip") ??
    peticion.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const huella = await huellaDeIp(ip);
  if (await seLePaso(`${huella ?? "sin-ip"}|${e.clave}`)) {
    return no("limite", 429);
  }

  const db = getDb();
  const correo = e.email.trim().toLowerCase();
  const ahora = new Date();
  const dominio = origen.dominio;

  /* La respuesta es SIEMPRE esta, exista el correo o no, se cree algo o no.
     Cualquier diferencia —un campo de más, otro código de estado, otro
     tiempo de respuesta— vuelve a convertir esto en una forma de averiguar
     quién tiene cuenta. */
  const recibido = () =>
    Response.json({ ok: true, mensaje: "revisa-tu-correo" });

  try {
    const [cuenta] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, correo))
      .limit(1);

    if (cuenta) {
      /* Ya tiene cuenta: no se le crea casillero, no se le escribe nada.
         Se le avisa al dueño y decide él. */
      await db
        .insert(altasCasillero)
        .values({
          id: nanoid(),
          origenId: origen.id,
          estado: "duplicada",
          motivo: "el correo ya tiene cuenta",
          ipHash: huella,
          urlReferente: peticion.headers.get("referer"),
          creadoEn: ahora,
        })
        .catch(() => undefined);
      await avisarQueYaTieneCuenta({ a: correo, dominio }).catch(
        () => undefined,
      );
      return recibido();
    }

    const usuarioId = nanoid();
    await db.insert(user).values({
      id: usuarioId,
      name: e.nombreLegal.trim(),
      email: correo,
      /* Sin verificar: quien creó esto todavía no ha probado que el buzón
         sea suyo. Lo prueba abriendo el correo que va a recibir. */
      emailVerified: false,
      createdAt: ahora,
      updatedAt: ahora,
    });

    const r = await crearCasillero({
      usuarioId,
      nombreLegal: e.nombreLegal,
      telefono: e.telefono,
      paisDestino: e.paisDestino.toUpperCase(),
      origenId: origen.id,
      urlReferente: peticion.headers.get("referer"),
      ipHash: huella,
      userAgent: peticion.headers.get("user-agent"),
    });
    if (!r.ok) return no(r.motivo);

    /* La dirección viaja al buzón, nunca en esta respuesta. */
    await mandarDireccionPorCorreo({
      a: correo,
      nombreLegal: e.nombreLegal,
      codigo: r.codigo,
      dominio,
    }).catch((fallo) => {
      console.error("[widget] no se pudo mandar la dirección:", fallo);
    });

    return recibido();
  } catch (fallo) {
    console.error("[widget] no se pudo crear el casillero:", fallo);
    await db
      .insert(altasCasillero)
      .values({
        id: nanoid(),
        origenId: origen.id,
        estado: "rechazada",
        motivo: "fallo",
        ipHash: huella,
        creadoEn: ahora,
      })
      .catch(() => undefined);
    return no("fallo", 500);
  }
}

/* Sin GET: esto no se abre en el navegador, se llama desde el formulario. */
export function GET() {
  return new Response(null, { status: 405 });
}
