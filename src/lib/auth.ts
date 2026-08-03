import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { cache } from "react";

import { getDb, schema } from "@/lib/db";
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
export const getAuth = cache(() => {
  const { env } = getCloudflareContext();

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema,
    }),
    basePath: RUTA_AUTH,
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.NEXT_PUBLIC_SITIO_URL,

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
            const { correoBienvenida } = await import("@/lib/correo/correos");
            await correoBienvenida({
              email: cuenta.email,
              name: cuenta.name,
              idioma: (cuenta as { idioma?: string }).idioma,
            });
          },
        },
      },
    },

    user: {
      additionalFields: {
        // Quien es cada cuenta dentro del sistema.
        // "soporte" es la cuenta interna de Windoce LLC y siempre lleva la
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
