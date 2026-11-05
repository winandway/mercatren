import { expoClient } from "@better-auth/expo/client";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { API_BASE, PREFIJO_DE_GALLETAS, RUTA_AUTH } from "./api";

/**
 * Las cuentas de Mercatren dentro de la app: las MISMAS de la web (Better
 * Auth, `src/lib/auth.ts` del sitio), con el complemento de Expo. La sesión se
 * guarda cifrada en el llavero del teléfono (SecureStore), nunca en texto.
 *
 * `basePath` va aparte del `baseURL` (igual que en la web): pegado a la
 * dirección, la librería le agrega su /api/auth y la petición se pierde.
 */
const conExpo = expoClient({
  scheme: "mercatren",
  storagePrefix: "mercatren",
  /* EL MISMO PREFIJO DE LAS GALLETAS DEL SITIO (`advanced.cookiePrefix` en
     `src/lib/auth.ts`). Sin esto el cliente busca «better-auth.session_token»,
     no reconoce la sesión que manda el servidor y la persona queda fuera
     aunque la cuenta se haya creado (pasó al probarlo, 5 nov 2026). */
  cookiePrefix: PREFIJO_DE_GALLETAS,
  storage: SecureStore,
});

/* Better Auth 1.6.25 declara `getActions` del complemento de Expo con un tipo
   que no encaja con el de su propio cliente (pasa igual con TypeScript 5.9 y
   6.0). Solo se reescribe ESE tipo, conservando lo que devuelve: `getCookie`,
   la sesión para las peticiones propias de la app. */
type AccionesDeExpo = ReturnType<typeof conExpo.getActions>;
const pluginExpo = conExpo as Omit<typeof conExpo, "getActions"> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActions: (...argumentos: any[]) => AccionesDeExpo;
};

export const authClient = createAuthClient({
  baseURL: API_BASE,
  basePath: RUTA_AUTH,
  plugins: [
    pluginExpo,
    inferAdditionalFields({
      user: {
        idioma: { type: "string", required: false },
        paisEntrega: { type: "string", required: false },
      },
    }),
  ],
});

/** La sesión, lista para mandarla en las peticiones propias de la app. */
export function cabeceraDeSesion(): Record<string, string> {
  const galleta = authClient.getCookie();
  return galleta ? { Cookie: galleta } : {};
}

/**
 * CERRAR SESIÓN (regla «Se puede entrar y se puede salir»): se avisa al
 * servidor para que borre la sesión de la base; si el aviso falla, se sale
 * igual borrando la sesión del teléfono. Dejar a alguien dentro por un error
 * de red es peor que sacarlo.
 */
export async function salir(): Promise<void> {
  try {
    const r = await authClient.signOut();
    if (!r.error) return;
  } catch {
    /* se sale igual, abajo */
  }
  await Promise.all(
    ["mercatren_cookie", "mercatren_session_data"].map((llave) =>
      SecureStore.deleteItemAsync(llave).catch(() => undefined),
    ),
  );
  authClient.$store.notify("$sessionSignal");
}
