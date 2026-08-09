import { getCloudflareContext } from "@opennextjs/cloudflare";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { getDb } from "@/lib/db";
import { productos, sociosTienda, tiendas } from "@/lib/db/schema";
import {
  generarToken,
  hashDeToken,
  igualesEnTiempoConstante,
  tokenDeLaPeticion,
} from "@/lib/socios/token";

/**
 * VINCULAR LA TIENDA DE UNA PLATAFORMA SOCIA (hoy QRbott).
 *
 * El comerciante toca «publicar también en Mercatren» en su panel de allá, y
 * su sistema llama aquí con la llave de socio. Devolvemos el token con el que
 * esa tienda —y solo esa— podrá leer y escribir su catálogo.
 *
 * ══ LO QUE EVITA EL DUPLICADO ══
 *
 * `slug_existente`. Si el comerciante YA tiene tienda en Mercatren y no lo
 * decimos, se le crea una segunda: su catálogo repartido entre dos direcciones,
 * las dos indexadas en Google, ninguna completa.
 *
 * Caso real: el piloto tiene 21 productos en Mercatren y 1 en QRbott. Sin este
 * campo, el botón le habría abierto una tienda vacía al lado de la que ya
 * vende.
 *
 * ══ POR QUÉ DEVOLVEMOS `productos_aqui` ══
 *
 * Para que la persona que aprieta el botón vea ANTES de confirmar que del lado
 * de Mercatren ya hay 21 productos. Descubrirlo después es descubrirlo cuando
 * ya se movió algo.
 *
 * ══ Y POR QUÉ ESTA RUTA SÍ SE CIERRA SI FALTA SU VARIABLE ══
 *
 * El resto del proyecto está hecho para funcionar a medias antes que caerse
 * (sin clave de correo el aviso se pierde pero la compra se completa). Esta no:
 * una puerta que entrega tokens de catálogos ajenos no puede quedar abierta
 * porque alguien olvidó cargar una variable.
 */

/**
 * LO QUE SE ACEPTA, Y POR QUÉ ADMITE `null`.
 *
 * La primera versión pedía que `slug_existente` viniera o **no viniera**, y
 * rechazaba con 400 un `slug_existente: null`. Eso está mal: un sistema que
 * arma el JSON desde su base escribe `null` para lo que no tiene — es lo
 * normal, no un error de quien llama.
 *
 * Costó una tarde de la otra sesión (8 ago 2026): el error decía solo
 * «peticion_invalida», sin nombrar el campo, así que tuvieron que adivinar
 * probando cinco cuerpos distintos hasta dar con la línea. Por eso ahora todo
 * lo opcional admite `null` **y** el 400 dice qué campo falló.
 */
const entrada = z.object({
  /** El identificador de la tienda EN EL SOCIO. Allá, el uuid del bot. */
  externo_id: z.string().trim().min(1),
  nombre: z.string().trim().min(1).max(120),
  /**
   * La tienda que YA existe aquí. Sin esto se crea una nueva.
   *
   * Se admite ausente, `null` y cadena vacía: las tres significan lo mismo —
   * «este comerciante no tiene tienda previa en Mercatren».
   */
  slug_existente: z
    .string()
    .trim()
    .max(120)
    .nullish()
    .transform((v) => v || undefined),
  plataforma: z
    .string()
    .trim()
    .max(40)
    .nullish()
    .transform((v) => v || "qrbott"),
});

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status });
}

export async function POST(peticion: Request) {
  const { env } = getCloudflareContext();
  const llave = env.SOCIO_LLAVE;

  if (!llave) {
    return json(
      {
        error: "no_disponible",
        mensaje: "La integracion no esta configurada.",
      },
      503,
    );
  }

  const presentada = tokenDeLaPeticion(peticion);
  if (!presentada || !igualesEnTiempoConstante(presentada, llave)) {
    return json({ error: "no_autorizado" }, 401);
  }

  /* El 400 dice QUÉ campo falló. Un "peticion_invalida" a secas obliga a quien
     integra a adivinar probando cuerpos distintos, y eso ya costó una tarde. */
  const analisis = entrada.safeParse(await peticion.json().catch(() => null));
  if (!analisis.success) {
    return json(
      {
        error: "peticion_invalida",
        campos: analisis.error.issues.map((i) => ({
          campo: i.path.join(".") || "(cuerpo)",
          problema: i.message,
        })),
      },
      400,
    );
  }
  const cuerpo = analisis.data;

  const db = getDb();

  /* Si esta tienda del socio ya estaba vinculada, NO se crea otra vez ni se
     abre una tienda nueva: se le entrega un token nuevo a la misma. Tocar el
     botón dos veces es lo más normal del mundo. */
  const [yaVinculada] = await db
    .select({ id: sociosTienda.id, tiendaId: sociosTienda.tiendaId })
    .from(sociosTienda)
    .where(
      and(
        eq(sociosTienda.plataforma, cuerpo.plataforma),
        eq(sociosTienda.externoId, cuerpo.externo_id),
      ),
    )
    .limit(1);

  let tiendaId: string;
  let slug: string;
  let creada = false;

  if (yaVinculada) {
    const [t] = await db
      .select({ id: tiendas.id, slug: tiendas.slug })
      .from(tiendas)
      .where(eq(tiendas.id, yaVinculada.tiendaId))
      .limit(1);
    if (!t) return json({ error: "tienda_no_existe" }, 409);
    tiendaId = t.id;
    slug = t.slug;
  } else if (cuerpo.slug_existente) {
    // Engancha una tienda que ya vende aquí. Confirmado por una persona.
    const [t] = await db
      .select({ id: tiendas.id, slug: tiendas.slug })
      .from(tiendas)
      .where(eq(tiendas.slug, cuerpo.slug_existente))
      .limit(1);

    if (!t) {
      return json(
        { error: "slug_no_existe", slug: cuerpo.slug_existente },
        404,
      );
    }

    /* Una tienda no puede colgar de dos sistemas: los dos le escribirían el
       catálogo y el último en llegar borraría lo del otro. */
    const [ocupada] = await db
      .select({ id: sociosTienda.id })
      .from(sociosTienda)
      .where(eq(sociosTienda.tiendaId, t.id))
      .limit(1);
    if (ocupada) return json({ error: "tienda_ya_vinculada" }, 409);

    tiendaId = t.id;
    slug = t.slug;
  } else {
    // Tienda nueva. El slug lleva un sufijo para no chocar con otra igual.
    tiendaId = nanoid();
    slug = `${aSlug(cuerpo.nombre)}-${nanoid(6).toLowerCase()}`;
    await db.insert(tiendas).values({
      id: tiendaId,
      slug,
      nombre: cuerpo.nombre,
      estado: "borrador",
    });
    creada = true;
  }

  const token = generarToken();
  const tokenHash = await hashDeToken(token);

  if (yaVinculada) {
    await db
      .update(sociosTienda)
      .set({ tokenHash, actualizadoEn: new Date() })
      .where(eq(sociosTienda.id, yaVinculada.id));
  } else {
    await db.insert(sociosTienda).values({
      id: nanoid(),
      tiendaId,
      plataforma: cuerpo.plataforma,
      externoId: cuerpo.externo_id,
      tokenHash,
    });
  }

  const [cuenta] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(productos)
    .where(eq(productos.tiendaId, tiendaId));

  return json({
    tienda_id: tiendaId,
    slug,
    creada,
    /* Se enseña ANTES de confirmar: si aquí hay 21 y allá 1, quien aprieta el
       botón tiene que verlo ahora, no después de mover algo. */
    productos_aqui: Number(cuenta?.n ?? 0),
    // El token en claro se ve UNA sola vez: de aquí en adelante solo su hash.
    token,
  });
}

function aSlug(nombre: string) {
  return (
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "tienda"
  );
}
