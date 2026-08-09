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
  /**
   * ENSAYO: comprueba todo y NO escribe nada.
   *
   * Nació de un problema real (9 ago 2026): cada intento de la otra sesión
   * dejaba una tienda de prueba en la base de producción. Iban dos, y cada una
   * hay que ir a borrarla a mano con el token.
   *
   * Con `probar: true` se valida el cuerpo, se mira si el slug existe y se
   * dice qué pasaría — pero no se crea la tienda ni se emite token. Así se
   * puede comprobar una integración las veces que haga falta sin dejar basura
   * en producción.
   */
  probar: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
  /**
   * Confirmación de que se sabe que esa tienda ya vende. **Hoy no es
   * obligatoria**, y esa marcha atrás tiene su historia.
   *
   * Durante unas horas del 9 ago 2026 sí lo fue: sin ella, enganchar una tienda
   * con productos respondía 409. Se puso porque la otra sesión apuntó lo que
   * creía un ensayo al slug del piloto y se llevó un token vivo de una tienda
   * con 21 productos vendiendo.
   *
   * Y hubo que quitarla el mismo día: el botón de QRbott lleva meses desplegado
   * sin conocer este campo, y su proveedor está en el tope de funciones y no
   * puede publicar la versión que lo manda. Resultado: el comerciante no podía
   * conectar su tienda. Una protección contra un error que ya no puede ocurrir
   * —el ensayo lo evita— dejando el producto inservible.
   *
   * Se sigue aceptando para los clientes que la mandan, y el día que todos lo
   * hagan puede volver a ser obligatoria.
   */
  confirmar: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
});

function json(cuerpo: unknown, status = 200) {
  return Response.json(cuerpo, { status });
}

/**
 * QUÉ VERSIÓN ESTÁ VIVA. Sin llave, sin escribir nada.
 *
 * ══ POR QUÉ EXISTE (9 ago 2026) ══
 *
 * Tres veces seguidas la otra sesión probó un arreglo mientras la publicación
 * estaba a medio subir, concluyó —con razón, según lo que veía— que el arreglo
 * «no está en producción», y se paró a esperar. Entre el push y el borde pasan
 * unos nueve minutos, y en esa ventana el sitio responde con la versión vieja
 * sin decir que lo es.
 *
 * El problema no era de ellos: era que no había forma de preguntar. Y yo
 * tampoco podía comprobarlo, porque la llave se revisa antes que el cuerpo y
 * sin llave nunca llego a la validación.
 *
 * Ahora se pregunta y ya. Si `capacidades` no trae lo que se espera, es que
 * todavía no propagó: se espera un minuto y se vuelve a preguntar. Nadie tiene
 * que deducirlo de un 400.
 *
 * Va abierto a propósito: no dice nada que no esté ya en
 * `docs/integracion-qrbott.md`, que es público.
 */
export async function GET() {
  return json({
    servicio: "socios",
    version: 1,
    capacidades: [
      // Se puede ensayar sin escribir: `"probar": true` en el cuerpo.
      "ensayo",
      // El 400 nombra el campo que falló, en vez de un "peticion_invalida" seco.
      "campos_en_error",
      // `null` vale lo mismo que no mandar la clave, en todo lo opcional.
      "null_en_opcionales",
      /* Al enganchar una tienda que ya vende, la respuesta trae
         `aviso_ya_vende` con cuántos productos tenía. Es un AVISO para que la
         pantalla lo enseñe, no una barrera: bloquear rompió un cliente ya
         desplegado que no manda `confirmar`. La protección real es el ensayo. */
      "aviso_si_ya_vende",
    ],
    rutas: {
      vincular: "POST /datos/socios/vincular — con la llave de socio",
      productos: "POST /datos/socios/productos — con el token de la tienda",
      cambios: "GET /datos/socios/cambios — con el token de la tienda",
    },
    contrato:
      "https://github.com/winandway/mercatren/blob/main/docs/integracion-qrbott.md",
  });
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

  /**
   * ENSAYO: se responde qué pasaría y NO se escribe nada.
   *
   * Va aquí, después de comprobar la llave y el cuerpo pero ANTES del primer
   * insert. Así el ensayo comprueba de verdad lo mismo que la llamada buena
   * —la llave, cada campo, si el slug existe— sin dejar una tienda de prueba
   * en producción.
   */
  if (cuerpo.probar) {
    const [existente] = cuerpo.slug_existente
      ? await db
          .select({ id: tiendas.id, nombre: tiendas.nombre })
          .from(tiendas)
          .where(eq(tiendas.slug, cuerpo.slug_existente))
          .limit(1)
      : [];

    const [cuantos] = existente
      ? await db
          .select({ n: sql<number>`COUNT(*)` })
          .from(productos)
          .where(eq(productos.tiendaId, existente.id))
      : [];

    return json({
      ensayo: true,
      cuerpo_valido: true,
      llave_valida: true,
      slug_pedido: cuerpo.slug_existente ?? null,
      slug_existe: cuerpo.slug_existente ? Boolean(existente) : null,
      nombre_de_esa_tienda: existente?.nombre ?? null,
      productos_aqui: existente ? Number(cuantos?.n ?? 0) : null,
      ya_vinculada: Boolean(yaVinculada),
      que_pasaria: yaVinculada
        ? "se le entrega un token nuevo a la tienda que ya estaba vinculada"
        : cuerpo.slug_existente
          ? existente
            ? "se engancharia esa tienda"
            : "ERROR: ese slug no existe, no se engancharia nada"
          : "se crearia una tienda NUEVA en borrador",
      // Nada se escribió: se puede repetir las veces que haga falta.
      se_escribio: false,
    });
  }

  let tiendaId: string;
  let slug: string;
  let creada = false;
  /** Cuántos productos ya tenía la tienda que se engancha. Aviso, no barrera. */
  let avisoYaVende: number | null = null;

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

    /**
     * SI LA TIENDA YA VENDE, HAY QUE DECIRLO DOS VECES.
     *
     * Enganchar una tienda vacía es inofensivo. Enganchar una que ya tiene
     * catálogo es entregárselo a un sistema externo, que a partir de ahí puede
     * cambiarle precios y retirarle productos.
     *
     * Pasó de verdad: apuntaron lo que creían un ensayo al slug del piloto y
     * se llevaron un token vivo de una tienda con 21 productos vendiendo.
     */
    const [cuantos] = await db
      .select({ n: sql<number>`COUNT(*)` })
      .from(productos)
      .where(eq(productos.tiendaId, t.id));
    const yaTiene = Number(cuantos?.n ?? 0);

    /**
     * ══ POR QUÉ ESTO AVISA EN VEZ DE BLOQUEAR (9 ago 2026, mismo día) ══
     *
     * La primera versión respondía 409 y no emitía token sin `confirmar: true`.
     * Duró unas horas y hubo que dar marcha atrás: **rompió un botón que ya
     * estaba funcionando.** El cliente de QRbott lleva meses desplegado, no
     * conoce ese campo, y su proveedor está en el tope de funciones y no puede
     * publicar la versión que sí lo manda.
     *
     * O sea: una protección contra un error que ya no puede ocurrir dejó al
     * comerciante sin poder conectar su tienda. El remedio salió peor.
     *
     * El accidente que la motivó —llevarse un token del piloto sin querer— lo
     * evita ya el ENSAYO (`probar: true`), que existe desde hoy y no escribe
     * nada. Esa es la protección de verdad; esto es el aviso.
     *
     * Se sigue aceptando `confirmar` y se sigue devolviendo `aviso_ya_vende`
     * para que la pantalla lo enseñe. El día que todos los clientes manden el
     * campo, esto puede volver a bloquear.
     */
    avisoYaVende = yaTiene > 0 ? yaTiene : null;

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
    /* Si se enganchó una tienda que ya vendía, va el número para que la
       pantalla lo enseñe. Es un aviso: no impide nada. */
    aviso_ya_vende: avisoYaVende,
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
