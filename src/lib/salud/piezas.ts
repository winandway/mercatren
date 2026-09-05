import "server-only";

import { desc, inArray } from "drizzle-orm";

import { getDb, schema } from "@/lib/db";
import { configuracion, latidosVigilante } from "@/lib/db/schema";
import { LLAVE_ULTIMO_TICK } from "@/lib/reloj/tick";
import { LLAVE_LATIDO_SINCRONIZAR } from "@/lib/vigilante/reglas";

/**
 * LAS PIEZAS DEL CANARIO, COMPARTIDAS CON EL VIGILANTE.
 *
 * Vivían dentro de `/datos/salud/route.ts`; el vigilante las necesita para
 * mirar lo mismo cada 20 minutos y avisar por correo cuando algo se apaga.
 * Ni un carácter de ninguna llave sale de aquí.
 */

/** La llave de CJ está viva: `ok`, `sin_llave` o `error`. */
/**
 * DE CUÁNTO FUE EL PRESUPUESTO DE PUNTOS, Y QUÉ LO SUBE (5 sep 2026).
 *
 * El dueño preguntó qué hay que comprarle a CJ para tener más puntos. Su
 * documentación dice «50.000 + 100 por dólar de transacciones» y **no define
 * qué cuenta como transacción**. Su propio aviso sí lo dice: con «Used today:
 * 61520, Remaining: 0» el presupuesto fue 61.520, o sea $115,20 contados.
 *
 * Puesto al lado de lo que él ve en el panel de CJ, eso contesta la pregunta
 * sin depender de que nadie nos explique nada — y deja de ser una pregunta
 * que hay que volver a hacer cada mes.
 */
export async function presupuestoDeCj(): Promise<{
  usados: number;
  quedan: number;
  productosQueAlcanzan: number;
  dolaresContados: number;
  haceMinutos: number;
} | null> {
  try {
    const { getDb } = await import("@/lib/db");
    const { configuracion } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { LLAVE_PUNTOS, leerPuntosDelDia, dolaresQueCuentan } =
      await import("@/lib/cj/puntos");
    const { PUNTOS_POR_PRODUCTO } = await import("@/lib/cj/reparto-de-puntos");
    const [fila] = await getDb()
      .select({ valor: configuracion.valor })
      .from(configuracion)
      .where(eq(configuracion.clave, LLAVE_PUNTOS))
      .limit(1);
    const p = leerPuntosDelDia(fila?.valor, Date.now());
    if (!p) return null;
    const total = p.usados + p.quedan;
    return {
      usados: p.usados,
      quedan: p.quedan,
      productosQueAlcanzan: Math.floor(total / PUNTOS_POR_PRODUCTO),
      dolaresContados: dolaresQueCuentan(p.usados, p.quedan),
      haceMinutos: Math.max(0, Math.round((Date.now() - p.enMs) / 60_000)),
    };
  } catch {
    return null;
  }
}

export async function saludDelProveedor(): Promise<string> {
  try {
    const { cjConfigurado } = await import("@/lib/cj/cliente");
    if (!cjConfigurado()) return "sin_llave";

    const { getDb } = await import("@/lib/db");
    const { configuracion } = await import("@/lib/db/schema");
    const { inArray } = await import("drizzle-orm");
    const {
      LLAVE_SIN_PUNTOS,
      LLAVE_ULTIMA_LLAMADA,
      leerUltimaLlamada,
      sigueSinPuntos,
    } = await import("@/lib/cj/puntos");

    const filas = await getDb()
      .select({ clave: configuracion.clave, valor: configuracion.valor })
      .from(configuracion)
      /* `inArray`, NO `eq(a) || eq(b)`: en JavaScript ese `||` devuelve el
         PRIMER operando —que es un objeto y siempre es verdadero—, así que la
         segunda condición se pierde y la consulta filtra solo por una. */
      .where(
        inArray(configuracion.clave, [LLAVE_SIN_PUNTOS, LLAVE_ULTIMA_LLAMADA]),
      )
      .catch(() => []);
    const de = (c: string) => filas.find((f) => f.clave === c)?.valor ?? null;

    /* «Sin puntos» no es «caído», y se arregla de otra forma: gastando menos
       llamadas o comprándole más. Decir «error» mandaba a buscar una avería
       que no existe (3 sep 2026). */
    if (sigueSinPuntos(de(LLAVE_SIN_PUNTOS), Date.now())) return "sin_puntos";

    const ultima = leerUltimaLlamada(de(LLAVE_ULTIMA_LLAMADA), Date.now());
    if (!ultima) return "sin_datos";
    return ultima.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

/**
 * ¿Está armado el aviso de Stripe? (31 ago 2026). De ese webhook depende que
 * un cobro se acredite solo. Consulta de SOLO LECTURA a Stripe.
 */
export async function avisoDeStripeArmado(
  env: Record<string, string | undefined>,
): Promise<string> {
  try {
    const clave = env.STRIPE_SECRET_KEY?.trim();
    if (!clave) return "sin_llave";
    const r = await fetch(
      "https://api.stripe.com/v1/webhook_endpoints?limit=16",
      { headers: { authorization: `Bearer ${clave}` } },
    );
    if (!r.ok) return "error";
    const d = (await r.json().catch(() => null)) as {
      data?: Array<{
        url?: string;
        status?: string;
        enabled_events?: string[];
      }>;
    } | null;
    const nuestro = (d?.data ?? []).find(
      (w) => (w.url ?? "").includes("/datos/stripe") && w.status === "enabled",
    );
    if (!nuestro) return "falta";
    const eventos = nuestro.enabled_events ?? [];
    if (!eventos.includes("*") && !eventos.includes("payment_intent.succeeded"))
      return "sin_evento";
    if (!env.STRIPE_WEBHOOK_SECRET?.trim()) return "sin_secreto";
    return "ok";
  } catch {
    return "error";
  }
}

/** El último latido del vigilante, para el canario: hace cuánto y con
 *  cuántas alertas. `null` si nunca corrió. */
/**
 * CÓMO VA EL CATÁLOGO, SIN ENTRAR AL PANEL (4 sep 2026).
 *
 * Lo pidió el dueño: «quiero saber si estamos produciendo los títulos, si
 * estamos publicando los más de cuarenta y seis mil productos». Ese conteo
 * ya lo mide el vigilante en cada corrida y solo se veía tras iniciar
 * sesión — así que para contestar había que entrar al panel a mirar.
 *
 * Se sirve el que dejó guardado el vigilante, NO se vuelve a contar: son
 * cincuenta mil fichas y este canario lo consulta cualquiera, cada minuto.
 *
 * NO ENSEÑA NINGÚN SECRETO: son conteos de un catálogo que ya es público.
 * Un producto a la venta se ve en la tienda y en el mapa del sitio; lo que
 * esto agrega es cuántos faltan, que es la pregunta que se estaba haciendo.
 */
export async function resumenDelCatalogo(): Promise<{
  haceMinutos: number;
  plazas: Array<{
    mercado: string;
    aLaVenta: number;
    enRevision: number;
    /** Publicados con el título todavía en inglés. */
    sinTraducir: number;
    /** Con el envío YA cotizado a CJ y metido dentro del precio. */
    conFleteReal: number;
    /** Con envío estimado: falta preguntárselo a CJ. */
    porAfinar: number;
    sinCostoBase: number;
  }>;
} | null> {
  try {
    const { inventarioDelUltimoLatido } =
      await import("@/lib/vigilante/inventario");
    const guardado = await inventarioDelUltimoLatido();
    if (!guardado) return null;
    return {
      haceMinutos: guardado.haceMinutos,
      plazas: guardado.plazas.map((p) => ({
        mercado: p.mercado,
        aLaVenta: p.publicados,
        enRevision: p.enRevision,
        /* Los latidos viejos no traen los dos campos nuevos. Se sirven en
           cero y no se esconde la plaza: media respuesta vale más que
           ninguna, y en veinte minutos el vigilante los llena. */
        sinTraducir: p.sinTraducir ?? 0,
        conFleteReal: p.conFleteReal ?? 0,
        porAfinar: p.porAfinar,
        sinCostoBase: p.sinCostoBase,
      })),
    };
  } catch {
    /* Un canario que se cae por una medida de más deja de servir para lo
       que existe: decir si la base y el cobro están vivos. */
    return null;
  }
}

export async function resumenDelVigilante(): Promise<{
  haceMinutos: number;
  alertas: number;
  rojas: number;
} | null> {
  try {
    const [ultimo] = await getDb()
      .select({
        corridoEn: latidosVigilante.corridoEn,
        alertas: latidosVigilante.alertas,
      })
      .from(latidosVigilante)
      .orderBy(desc(latidosVigilante.corridoEn))
      .limit(1);
    if (!ultimo) return null;
    const lista = JSON.parse(ultimo.alertas || "[]") as Array<{
      nivel?: string;
    }>;
    return {
      haceMinutos: Math.max(
        0,
        Math.round((Date.now() - ultimo.corridoEn.getTime()) / 60_000),
      ),
      alertas: lista.length,
      rojas: lista.filter((a) => a.nivel === "rojo").length,
    };
  } catch {
    return null;
  }
}

/** El último latido del reloj (propio o de GitHub), en minutos. `null` si
 *  nunca latió. Es lo que permite ver desde fuera si el sitio se mueve solo. */
export async function resumenDelReloj(): Promise<{
  haceMinutos: number;
  /** El último latido que TERMINÓ su trabajo: de dónde vino, cuánto tardó
   *  y qué hizo. Si la marca se reclama y esto no avanza, el trabajo se
   *  está cortando. */
  ultimo: {
    haceMinutos: number;
    origen: string;
    duracionMs: number;
    hizo: string[];
  } | null;
} | null> {
  try {
    const filas = await getDb()
      .select({ clave: configuracion.clave, valor: configuracion.valor })
      .from(configuracion)
      .where(
        inArray(configuracion.clave, [
          LLAVE_LATIDO_SINCRONIZAR,
          LLAVE_ULTIMO_TICK,
        ]),
      );
    const marca = Number(
      filas.find((f) => f.clave === LLAVE_LATIDO_SINCRONIZAR)?.valor,
    );
    if (!Number.isFinite(marca) || marca <= 0) return null;
    let ultimo = null;
    const crudo = filas.find((f) => f.clave === LLAVE_ULTIMO_TICK)?.valor;
    if (crudo) {
      const t = JSON.parse(crudo) as {
        en?: number;
        origen?: string;
        duracionMs?: number;
        hizo?: string[];
      };
      ultimo = {
        haceMinutos: Math.max(
          0,
          Math.round((Date.now() - Number(t.en ?? 0)) / 60_000),
        ),
        origen: String(t.origen ?? ""),
        duracionMs: Number(t.duracionMs ?? 0),
        hizo: Array.isArray(t.hizo) ? t.hizo : [],
      };
    }
    return {
      haceMinutos: Math.max(0, Math.round((Date.now() - marca) / 60_000)),
      ultimo,
    };
  } catch {
    return null;
  }
}

/**
 * ¿DE DÓNDE SALE LA CLAVE CON LA QUE SE FIRMAN LAS SESIONES? (3 sep 2026)
 *
 * Nadie podía entrar —ni el dueño, ni un cliente recién registrado, ni con
 * el enlace de recuperar la contraseña—: la cuenta se creaba, la cookie se
 * emitía, y `get-session` devolvía `null` siempre. Con la clave viniendo de
 * la base, si esa fila no se puede leer o escribir, **cada petición firma
 * con una clave distinta** y ninguna sesión vale nunca.
 *
 * Esto lo dice sin enseñar ni un carácter de la clave: solo de dónde sale.
 * Saber que existe no ayuda a nadie a falsificarla.
 */
export async function origenDeLaClaveDeSesiones(
  env: Record<string, string | undefined>,
): Promise<{ origen: string; huella: string; usada: string }> {
  const huellaDe = async (valor: string) => {
    /* Ocho caracteres del SHA-256: sirven para comparar entre peticiones y
       no permiten reconstruir nada. Si la huella CAMBIA entre dos llamadas,
       cada petición está firmando con una clave distinta y por eso ninguna
       sesión vale. */
    const datos = new TextEncoder().encode(valor);
    const hash = await crypto.subtle.digest("SHA-256", datos);
    return Array.from(new Uint8Array(hash).slice(0, 4))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };
  /* LA HUELLA DE LA CLAVE QUE DE VERDAD SE USA (3 sep 2026). Antes esto
     miraba la fila de la base por su cuenta, y por eso decía «estable»
     mientras las sesiones no valían: hay que preguntarle a la MISMA función
     que arma el sistema de cuentas. */
  let laQueSeUsa = "";
  try {
    const { secretoDeSesiones } = await import("@/lib/auth");
    laQueSeUsa = await secretoDeSesiones(
      env as unknown as Parameters<typeof secretoDeSesiones>[0],
    );
  } catch {
    laQueSeUsa = "";
  }
  const usada = laQueSeUsa ? await huellaDe(laQueSeUsa) : "error";

  const deLaVariable = env.BETTER_AUTH_SECRET?.trim();
  if (deLaVariable) {
    return {
      origen: "variable",
      huella: await huellaDe(deLaVariable),
      usada,
    };
  }
  try {
    const { getDb, schema } = await import("@/lib/db");
    const { eq } = await import("drizzle-orm");
    const [fila] = await getDb()
      .select({ valor: schema.configuracion.valor })
      .from(schema.configuracion)
      .where(eq(schema.configuracion.clave, "auth_secret"))
      .limit(1);
    if (!fila?.valor) return { origen: "falta", huella: "", usada };
    return { origen: "base", huella: await huellaDe(fila.valor), usada };
  } catch {
    return { origen: "error", huella: "", usada };
  }
}

/**
 * ¿SE ESTÁN GUARDANDO LAS SESIONES? (3 sep 2026)
 *
 * Si `get-session` devuelve `null` siempre, hay dos culpables posibles: la
 * firma de la cookie (la clave cambió) o que la fila de la sesión no esté en
 * la base. Esto distingue: cuenta las sesiones creadas en la última hora.
 * Cero con gente entrando significa que las escrituras no están llegando.
 * No enseña ni un token ni un correo: solo un número.
 */
export async function sesionesRecientes(): Promise<{
  ultimaHora: number;
  /** Cuándo vence la última sesión creada, en crudo y ya convertida. Si sale
   *  en 1970 o en el año 58548, es un problema de unidades y la sesión nace
   *  vencida: por eso `get-session` devolvería `null` siempre. */
  ultimaExpiraEn: number | null;
  ultimaCreadaEn: number | null;
  largoDelToken: number | null;
}> {
  try {
    const { getDb, schema } = await import("@/lib/db");
    const { desc, gt, sql } = await import("drizzle-orm");
    const haceUnaHora = new Date(Date.now() - 3_600_000);
    const [f] = await getDb()
      .select({ n: sql<number>`count(*)` })
      .from(schema.session)
      .where(gt(schema.session.createdAt, haceUnaHora));
    const [ultima] = await getDb()
      .select({
        expira: sql<number>`expires_at`,
        creada: sql<number>`created_at`,
        /* El LARGO del token, nunca el token. Un token de sesión mide 32;
           si mide más, se está guardando con la firma pegada y entonces la
           búsqueda por token nunca lo encuentra: `get-session` daría `null`
           para todo el mundo. */
        largoToken: sql<number>`length(token)`,
      })
      .from(schema.session)
      .orderBy(desc(sql`created_at`))
      .limit(1);
    return {
      ultimaHora: Number(f?.n ?? 0),
      ultimaExpiraEn: ultima ? Number(ultima.expira) : null,
      ultimaCreadaEn: ultima ? Number(ultima.creada) : null,
      largoDelToken: ultima ? Number(ultima.largoToken) : null,
    };
  } catch (fallo) {
    console.error("[salud] no se pudieron mirar las sesiones:", fallo);
    return {
      ultimaHora: -1,
      ultimaExpiraEn: null,
      ultimaCreadaEn: null,
      largoDelToken: null,
    };
  }
}

/**
 * ¿SE PUEDEN LEER LAS FILAS DE SESIÓN Y DE CUENTA TAL COMO LAS PIDE EL
 * SISTEMA DE CUENTAS? (3 sep 2026)
 *
 * Better Auth lee esas dos tablas con TODAS las columnas del esquema. Si la
 * base de producción tiene una tabla más vieja —a la que le falta una
 * columna—, el SELECT falla, el adaptador se lo traga y `get-session`
 * devuelve `null` para todo el mundo: nadie puede entrar y no hay ni un
 * error en ninguna pantalla. Esto ejecuta esa misma lectura y devuelve el
 * motivo exacto. No enseña ni un dato de nadie: solo «ok» o el error.
 */
export async function lecturaDeCuentas(): Promise<Record<string, string>> {
  const probar = async (nombre: string, hacer: () => Promise<unknown>) => {
    try {
      await hacer();
      return "ok";
    } catch (fallo) {
      const m = fallo instanceof Error ? fallo.message : String(fallo);
      return m.replace(/\s+/g, " ").slice(0, 160);
    }
  };
  try {
    const { getDb, schema } = await import("@/lib/db");
    const db = getDb();
    return {
      session: await probar("session", () =>
        db.select().from(schema.session).limit(1),
      ),
      user: await probar("user", () => db.select().from(schema.user).limit(1)),
      account: await probar("account", () =>
        db.select().from(schema.account).limit(1),
      ),
      verification: await probar("verification", () =>
        db.select().from(schema.verification).limit(1),
      ),
    };
  } catch (fallo) {
    return {
      todo: fallo instanceof Error ? fallo.message.slice(0, 160) : "error",
    };
  }
}

/** La cuenta fija con la que el canario prueba las sesiones. Sin contraseña,
    sin cuenta de acceso, rol cliente: no sirve para entrar a nada. */
const USUARIO_DIAGNOSTICO = "diagnostico-salud";
const CORREO_DIAGNOSTICO = "diagnostico@mercatren.com";

/** La cookie de sesión firmada como la firma better-call: `valor.HMAC-SHA256`
    en base64, y todo pasado por encodeURIComponent. */
async function firmarCookie(valor: string, secreto: string): Promise<string> {
  const llave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const firma = await crypto.subtle.sign(
    "HMAC",
    llave,
    new TextEncoder().encode(valor),
  );
  const base64 = btoa(String.fromCharCode(...new Uint8Array(firma)));
  return encodeURIComponent(`${valor}.${base64}`);
}

/**
 * BORRAR LAS CUENTAS BASURA QUE DEJÓ LA SONDA VIEJA (5 sep 2026).
 *
 * `diagnostico+xxxxxxxx@mercatren.com`, «Soporte Diagnóstico», una por cada
 * visita a /datos/salud desde el 3 de septiembre. Nunca compraron, nunca
 * entraron: se borran con sus sesiones y sus cuentas de acceso, de a 50 por
 * visita para no pasarse del tope de parámetros de la base. Devuelve cuántas.
 */
async function limpiarCuentasDeDiagnostico(): Promise<number> {
  const { and, eq, inArray, like } = await import("drizzle-orm");
  const db = getDb();
  const basura = await db
    .select({ id: schema.user.id })
    .from(schema.user)
    .where(
      and(
        like(schema.user.email, "diagnostico+%@mercatren.com"),
        eq(schema.user.name, "Soporte Diagnóstico"),
      ),
    )
    .limit(50);
  const ids = basura.map((u) => u.id);
  if (ids.length === 0) return 0;
  await db.delete(schema.session).where(inArray(schema.session.userId, ids));
  await db.delete(schema.account).where(inArray(schema.account.userId, ids));
  await db.delete(schema.user).where(inArray(schema.user.id, ids));
  return ids.length;
}

/**
 * LA PRUEBA DEFINITIVA: LEER UNA SESIÓN DENTRO DEL PROPIO SERVIDOR (3 sep 2026)
 *
 * `get-session` devolvía `null` para todo el mundo con la sesión bien
 * guardada (token de 32, fechas correctas), la clave estable y las cuatro
 * tablas legibles. Cuando todos los datos están bien y el resultado sigue
 * mal, lo que falta es el ERROR, y el error vive dentro del sistema de
 * cuentas: aquí se le pide que lea la última sesión de la base y se
 * devuelve lo que conteste, excepción incluida.
 *
 * No sale ni un token ni un correo: solo «ok», «null» o el mensaje del fallo.
 */
export async function pruebaDeLectura(): Promise<Record<string, string>> {
  try {
    const { getDb, schema } = await import("@/lib/db");
    const { desc, sql } = await import("drizzle-orm");
    const [ultima] = await getDb()
      .select({ token: schema.session.token })
      .from(schema.session)
      .orderBy(desc(sql`created_at`))
      .limit(1);
    if (!ultima?.token) return { estado: "sin sesiones que probar" };

    const { getAuth } = await import("@/lib/auth");
    const auth = await getAuth();

    /* ══ EL CICLO COMPLETO, DENTRO DEL SERVIDOR — SIN CREAR CUENTAS (5 sep 2026) ══
       Se crea una sesión efímera para la cuenta fija de diagnóstico, se firma
       la cookie EXACTAMENTE como la firma el sistema de cuentas (HMAC-SHA256
       con su secreto, como hace better-call) y se le pide leerla en el acto.
       Si esto falla, el fallo está en el sistema de cuentas y no en el
       navegador ni en el camino.

       La versión del 3 de septiembre hacía esto dando de alta una cuenta: creaba UNA
       CUENTA NUEVA en cada visita a /datos/salud —que es pública y la toca el
       vigilante cada 20 minutos—, y cada cuenta disparaba la bienvenida y el
       aviso «Cuenta nueva: Soporte Diagnóstico» al buzón del equipo. Cientos
       de correos y de cuentas basura en dos días. Ahora la cuenta es UNA,
       insertada directo en la tabla (sin pasar por los hooks que mandan
       correo), sin contraseña ni forma de entrar con ella, y la sesión de
       prueba se borra al terminar. */
    let ciclo = "no probado";
    let limpiadas = 0;
    try {
      const { eq } = await import("drizzle-orm");
      const db = getDb();
      await db
        .insert(schema.user)
        .values({
          id: USUARIO_DIAGNOSTICO,
          name: "Soporte Diagnóstico",
          email: CORREO_DIAGNOSTICO,
          emailVerified: false,
          rol: "cliente",
        })
        .onConflictDoNothing();

      const contexto = await auth.$context;
      const token = crypto.randomUUID().replace(/-/g, "");
      const idSesion = `diagnostico-${crypto.randomUUID()}`;
      await db.insert(schema.session).values({
        id: idSesion,
        token,
        userId: USUARIO_DIAGNOSTICO,
        expiresAt: new Date(Date.now() + 2 * 60 * 1000),
        ipAddress: "",
        userAgent: "canario",
      });
      try {
        const nombre = contexto.authCookies.sessionToken.name;
        const firmada = await firmarCookie(token, contexto.secret);
        const leida = await auth.api.getSession({
          headers: new Headers({ cookie: `${nombre}=${firmada}` }),
        });
        ciclo = leida?.session ? "ok" : `null (cookie ${nombre})`;
      } finally {
        await db
          .delete(schema.session)
          .where(eq(schema.session.id, idSesion))
          .catch(() => undefined);
      }
      limpiadas = await limpiarCuentasDeDiagnostico();
    } catch (fallo) {
      ciclo =
        fallo instanceof Error
          ? fallo.message.replace(/\s+/g, " ").slice(0, 200)
          : "error";
    }

    const intentar = async (nombre: string) => {
      try {
        const r = await auth.api.getSession({
          headers: new Headers({ cookie: `${nombre}=${ultima.token}` }),
        });
        return r?.session ? "ok" : "null";
      } catch (fallo) {
        const m = fallo instanceof Error ? fallo.message : String(fallo);
        return m.replace(/\s+/g, " ").slice(0, 200);
      }
    };
    return {
      ciclo,
      limpiadas: String(limpiadas),
      conPrefijo: await intentar("__Secure-mercatren.session_token"),
      sinPrefijo: await intentar("mercatren.session_token"),
    };
  } catch (fallo) {
    return {
      estado: fallo instanceof Error ? fallo.message.slice(0, 200) : "error",
    };
  }
}
