import { nanoid } from "nanoid";
import { z } from "zod";

import { crearCasillero } from "@/lib/casillero/crear";
import { lineasDeEtiqueta } from "@/lib/casillero/bodega";
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
 * **La cuenta se crea con el correo**: quien ya tenga cuenta en Mercatren
 * recibe su casillero en ella, no una segunda cuenta con la misma persona
 * dentro.
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

  try {
    /* La cuenta: si ya existe, se usa. Dos cuentas para la misma persona
       son dos contraseñas y un casillero que ella no encuentra. */
    const [cuenta] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, correo))
      .limit(1);

    let usuarioId = cuenta?.id;
    if (!usuarioId) {
      usuarioId = nanoid();
      await db.insert(user).values({
        id: usuarioId,
        name: e.nombreLegal.trim(),
        email: correo,
        emailVerified: false,
        createdAt: ahora,
        updatedAt: ahora,
      });
    }

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

    /* La dirección se devuelve AQUÍ y solo aquí: ya tiene casillero, así
       que ya tiene código, que es lo que hace que la dirección sirva. */
    return Response.json({
      ok: true,
      codigo: r.codigo,
      yaExistia: r.yaExistia,
      lineas: lineasDeEtiqueta(e.nombreLegal, r.codigo, "es"),
    });
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
