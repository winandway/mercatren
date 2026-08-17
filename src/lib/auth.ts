import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { cache } from "react";

import { eq } from "drizzle-orm";

import { getDb, schema } from "@/lib/db";
import { MERCADOS } from "@/lib/mercado/mercados";
import { RUTA_AUTH } from "@/lib/rutas";

/**
 * Sistema de cuentas de Mercatren.
 *
 * Se construye por peticion porque la base de datos vive en el contexto del
 * Worker, no en el arranque del proceso.
 *
 * Ojo con las rutas: en YaDominios Cloud el prefijo /api/ lo capturan los
 * archivos estaticos antes de llegar al codigo, asi que el login vive en
 * /datos/auth (ver src/lib/rutas.ts).
 */
/** La clave guardada en la base, bajo esta llave. */
const LLAVE_SECRETO = "auth_secret";

/**
 * La clave con la que se firman las sesiones.
 *
 * Sin ella NADIE puede entrar ni crear una cuenta. Se busca en dos sitios, en
 * este orden:
 *
 *   1. La variable de entorno del panel. Es lo correcto y SIEMPRE manda.
 *   2. La propia base del sitio. Si nadie cargo la variable, el sitio se
 *      genera una la primera vez y la guarda ahi.
 *
 * El segundo camino existe porque el repositorio es publico y la clave no
 * puede ir en el codigo: sin el, un sitio recien publicado se queda sin
 * poder autenticar a nadie hasta que una persona entre al panel a cargarla,
 * y eso es justo lo que paso en produccion. La base del sitio es privada, asi
 * que guardarla ahi no la expone mas de lo que la expondria el panel.
 *
 * El INSERT es "o ignora": si dos peticiones llegan a la vez, gana una sola y
 * las dos terminan usando la misma clave.
 */
async function secretoDeSesiones(env: CloudflareEnv) {
  if (env.BETTER_AUTH_SECRET) return env.BETTER_AUTH_SECRET;

  const db = getDb();

  const [guardado] = await db
    .select({ valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(eq(schema.configuracion.clave, LLAVE_SECRETO))
    .limit(1);

  if (guardado?.valor) return guardado.valor;

  // Se genera con el generador criptografico del entorno, no con Math.random.
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nuevo = btoa(String.fromCharCode(...bytes));

  await db
    .insert(schema.configuracion)
    .values({ clave: LLAVE_SECRETO, valor: nuevo })
    .onConflictDoNothing();

  const [definitivo] = await db
    .select({ valor: schema.configuracion.valor })
    .from(schema.configuracion)
    .where(eq(schema.configuracion.clave, LLAVE_SECRETO))
    .limit(1);

  return definitivo?.valor ?? nuevo;
}

export const getAuth = cache(async () => {
  const { env } = getCloudflareContext();

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema,
    }),
    basePath: RUTA_AUTH,
    secret: await secretoDeSesiones(env),
    baseURL: env.NEXT_PUBLIC_SITIO_URL,
    /**
     * LOS DOMINIOS DE LOS MERCADOS SON ORÍGENES DE CONFIANZA.
     *
     * Sin esto, entrar desde mercatren.cl se rechaza en silencio: Better
     * Auth compara el Origin de la petición contra el baseURL (que dice
     * mercatren.com) y descarta el login como si fuera otro sitio. La
     * sesión sigue siendo por dominio —una cookie no cruza de .com a .cl—,
     * pero la MISMA cuenta entra en los dos.
     */
    trustedOrigins: MERCADOS.flatMap((m) => [
      `https://${m.dominio}`,
      `https://www.${m.dominio}`,
    ]),

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      // El enlace para crear una contrasena nueva sale por correo, en el
      // idioma que la cuenta tenga guardado.
      sendResetPassword: async ({ user: cuenta, url }) => {
        const { correoRestablecerClave } = await import("@/lib/correo/correos");
        await correoRestablecerClave(
          {
            email: cuenta.email,
            name: cuenta.name,
            idioma: (cuenta as { idioma?: string }).idioma,
          },
          url,
        );
      },
    },

    databaseHooks: {
      user: {
        create: {
          // La bienvenida sale al crear la cuenta. Si el correo falla, la
          // cuenta se crea igual: avisar nunca es requisito.
          after: async (cuenta) => {
            const { correoBienvenida, correoAvisoCuentaNueva } =
              await import("@/lib/correo/correos");

            // A la persona: su bienvenida.
            await correoBienvenida({
              email: cuenta.email,
              name: cuenta.name,
              idioma: (cuenta as { idioma?: string }).idioma,
            });

            /**
             * Y AL EQUIPO: que alguien acaba de entrar.
             *
             * Sin esto no nos enterábamos de nada. Una cuenta nueva podía pasar
             * días intentando usar el sistema —y chocándose con fallos— sin que
             * nadie del equipo supiera siquiera que existía. Pasó: un comercio
             * estuvo una tarde entera sin poder cargar sus productos y lo
             * supimos porque escribió por WhatsApp.
             *
             * Va aparte del aviso de comercio nuevo: ese solo salta cuando dan
             * de alta la tienda, y hasta ese momento la persona es invisible.
             */
            await correoAvisoCuentaNueva({
              email: cuenta.email,
              name: cuenta.name,
            });
          },
        },
      },
    },

    user: {
      additionalFields: {
        // Quien es cada cuenta dentro del sistema.
        // "soporte" es la cuenta interna de Windoce, LLC y siempre lleva la
        // palabra Soporte en el nombre visible.
        rol: {
          type: "string",
          required: false,
          defaultValue: "cliente",
          // No se puede mandar desde el formulario de registro: se asigna aparte.
          input: false,
        },
        idioma: {
          type: "string",
          required: false,
          defaultValue: "es",
        },
        paisEntrega: {
          type: "string",
          required: false,
        },
        telefono: {
          type: "string",
          required: false,
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 dias
      updateAge: 60 * 60 * 24, // se renueva una vez al dia
    },

    advanced: {
      cookiePrefix: "mercatren",
    },

    // nextCookies siempre va de ultimo en la lista.
    plugins: [nextCookies()],
  });
});

export type Auth = ReturnType<typeof getAuth>;
